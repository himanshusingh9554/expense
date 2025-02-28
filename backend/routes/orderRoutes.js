import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import Order from '../models/order.js';
import User from '../models/user.js';
import { Cashfree } from 'cashfree-pg';

const router = express.Router();

// 1. Set your Cashfree credentials from environment variables
Cashfree.XClientId = process.env.CF_CLIENT_ID;      
Cashfree.XClientSecret = process.env.CF_CLIENT_SECRET;
if (process.env.CF_MODE === 'PROD') {
  Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;
} else {
  Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
}

// ====================================================================
// POST /api/orders/create
// Creates a new order in Cashfree PG v3, returns payment_session_id
// ====================================================================
router.post('/create', authenticateUser, async (req, res) => {
  try {
    // 2. The user who is purchasing
    const userId = req.user.id;  // from authMiddleware
    const { amount } = req.body; // e.g., 499

    // 3. Prepare the order request for Cashfree
    const orderRequest = {
      order_amount: amount.toString(),
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: 'test',            // Replace with real name from DB if desired
        customer_email: 'test@gmail.com', // Replace with real email
        customer_phone: '9876543210'      // Replace with real phone
      },
      order_note: 'Premium Purchase',
      order_meta: {
        // After payment, Cashfree will redirect the user to this URL
        return_url: "http://localhost:5000/dashboard.html?status=success&order_id={order_id}",
        // Cashfree will POST payment result to this callback (needs public URL or ngrok)
        notify_url: "http://localhost:5000/api/orders/callback"
      }
    };

    // 4. Create the order via Cashfree PG
    const version = '2023-08-01';
    const createResponse = await Cashfree.PGCreateOrder(version, orderRequest);

    // 5. Validate the response
    if (!createResponse || !createResponse.data) {
      console.error('Cashfree create order error:', createResponse);
      return res.status(400).json({
        success: false,
        message: 'Could not create Cashfree order'
      });
    }

    // 6. Cashfree returns "order_id" (the one that starts with "order_...") 
    //    and "payment_session_id"
    const { order_id, payment_session_id } = createResponse.data;

    console.log('Cashfree response data:', createResponse.data);
    console.log('order_id:', order_id);
    console.log('payment_session_id:', payment_session_id);

    // 7. Make sure we have both
    if (!order_id || !payment_session_id) {
      console.error('Missing order_id/payment_session_id:', createResponse.data);
      return res.status(400).json({
        success: false,
        message: 'Cashfree order creation incomplete'
      });
    }

    // 8. Store the "order_id" in the DB so we can match it in the callback
    const newOrder = await Order.create({
      userId,
      amount,
      status: 'PENDING',
      // Store "order_id" in cfOrderId 
      // (despite the name, it should hold the string "order_...")
      cfOrderId: order_id,         
      paymentSessionId: payment_session_id
    });

    // 9. Return data to the frontend
    return res.json({
      success: true,
      message: 'Order created successfully',
      order_id,               // for reference
      payment_session_id,     // used by Cashfree checkout
      dbOrderId: newOrder.id  // internal DB ID
    });

  } catch (error) {
    console.error('Error creating order:', error);
    if (error.response?.data) {
      console.error('Cashfree error data:', error.response.data);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/verifyPayment', authenticateUser, async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'Missing order_id' });
    }

    // Use whichever version your library actually supports
    const version = '2022-09-01'; // or "2023-08-01"
    // If your library uses PGFetchOrder instead of PGGetOrderDetails, call that
    const orderDetailsResponse = await Cashfree.PGFetchOrder(version, order_id);

    if (!orderDetailsResponse || !orderDetailsResponse.data) {
      return res.status(400).json({ success: false, message: 'No data from Cashfree' });
    }

    const { order_status } = orderDetailsResponse.data;
    console.log('verifyPayment -> order_status:', order_status);

    // If paid, mark DB order + user premium
    if (order_status === 'PAID') {
      const order = await Order.findOne({ where: { cfOrderId: order_id } });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found in DB' });
      }
      order.status = 'SUCCESSFUL';
      await order.save();

      const user = await User.findByPk(order.userId);
      if (user) {
        user.premium = true;
        await user.save();
      }

      return res.json({ success: true, message: 'Payment verified. Premium unlocked.' });
    } else {
      return res.json({ success: false, message: `Payment status: ${order_status}` });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




router.post('/callback', async (req, res) => {
  try {
    // 1. See if we actually receive the callback
    console.log('Cashfree Callback:', req.body);

    // Cashfree typically sends { order_id: "...", order_status: "PAID" or "FAILED", ... }
    const { order_id, order_status } = req.body;
    console.log('order_id from callback:', order_id);
    console.log('order_status from callback:', order_status);

    // 2. Find the matching order in your DB by "order_id"
    //    because we stored "order_id" in cfOrderId
    const order = await Order.findOne({ where: { cfOrderId: order_id } });
    if (!order) {
      console.error('Order not found:', order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    // 3. Update the order status & user premium if payment is successful
    if (order_status === 'PAID') {
      order.status = 'SUCCESSFUL';
      await order.save();

      // Mark user as premium
      const user = await User.findByPk(order.userId);
      if (user) {
        user.premium = true;
        await user.save();
      }

      return res.json({ success: true, message: 'Transaction successful' });
    } else {
      // If payment failed
      order.status = 'FAILED';
      await order.save();
      return res.json({ success: false, message: 'Transaction failed' });
    }
  } catch (error) {
    console.error('Error in callback:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
