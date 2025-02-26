// orderRoutes.js
import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import Order from '../models/order.js';
import User from '../models/user.js';
import { Cashfree } from 'cashfree-pg';

const router = express.Router();

Cashfree.XClientId = process.env.CF_CLIENT_ID;
Cashfree.XClientSecret = process.env.CF_CLIENT_SECRET;

// Decide sandbox vs production
if (process.env.CF_MODE === 'PROD') {
  Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;
} else {
  Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
}

router.post('/create', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const orderRequest = {
      order_amount: amount.toString(),    
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: 'John Doe',        
        customer_email: 'john@example.com',
        customer_phone: '9876543210'
      },
      order_meta: {
        return_url: 'http://localhost:5500/dashboard.html?order_id={order_id}',
      },
      order_note: 'Premium Purchase'
    };

    const version = '2023-08-01'; 
    const createResponse = await Cashfree.PGCreateOrder(version, orderRequest);

    if (!createResponse || !createResponse.data) {
      console.error('Cashfree create order error:', createResponse);
      return res.status(400).json({
        success: false,
        message: 'Could not create Cashfree order'
      });
    }
    
    // Destructure the necessary fields from Cashfree's response
    const { cf_order_id, payment_session_id } = createResponse.data;
    if (!cf_order_id || !payment_session_id) {
      console.error('Cashfree response missing cf_order_id/payment_session_id:', createResponse.data);
      return res.status(400).json({
        success: false,
        message: 'Cashfree order creation incomplete'
      });
    }

    // Create order with new fields added
    const newOrder = await Order.create({
      userId,
      amount,
      status: 'PENDING',
      cfOrderId: cf_order_id,            // Storing Cashfree Order ID
      paymentSessionId: payment_session_id // Storing Payment Session ID
    });

    let domain = (Cashfree.XEnvironment === Cashfree.Environment.PRODUCTION)
      ? 'api.cashfree.com'
      : 'sandbox.cashfree.com';

    const checkoutUrl = `https://${domain}/pg/orders/${cf_order_id}?payment_session_id=${payment_session_id}`;

    return res.json({
      success: true,
      message: 'Order created successfully',
      checkoutUrl,
      orderId: newOrder.id
    });
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.response?.data) {
      console.error('Cashfree error data:', error.response.data);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/callback', async (req, res) => {
  try {
    console.log('Cashfree Callback:', req.body);
    const { order_id, order_status } = req.body; // order_id is Cashfree's ID

    // Look up order using cfOrderId field rather than primary key
    const order = await Order.findOne({ where: { cfOrderId: order_id } });
    if (!order) {
      console.error('Order not found for Cashfree order:', order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order_status === 'PAID') {
      order.status = 'SUCCESSFUL';
      await order.save();

      const user = await User.findByPk(order.userId);
      if (user) {
        user.premium = true;
        await user.save();
      }

      return res.json({ success: true, message: 'Transaction successful' });
    } else {
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
