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
        customer_name: 'test',            
        customer_email: 'test@gmail.com',
        customer_phone: '9876543210'      
      },
      order_note: 'Premium Purchase',
      order_meta: {
      
        return_url: "http://localhost:5000/dashboard.html?status=success&order_id={order_id}",
       
        notify_url: "http://localhost:5000/api/orders/callback"
      }
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

   
    const { order_id, payment_session_id } = createResponse.data;

    console.log('Cashfree response data:', createResponse.data);
    console.log('order_id:', order_id);
    console.log('payment_session_id:', payment_session_id);

   
    if (!order_id || !payment_session_id) {
      console.error('Missing order_id/payment_session_id:', createResponse.data);
      return res.status(400).json({
        success: false,
        message: 'Cashfree order creation incomplete'
      });
    }

  
    const newOrder = await Order.create({
      userId,
      amount,
      status: 'PENDING',
      cfOrderId: order_id,         
      paymentSessionId: payment_session_id
    });

    
    return res.json({
      success: true,
      message: 'Order created successfully',
      order_id,               
      payment_session_id,
      dbOrderId: newOrder.id  
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
    const version = '2022-09-01';
   
    const orderDetailsResponse = await Cashfree.PGFetchOrder(version, order_id);

    if (!orderDetailsResponse || !orderDetailsResponse.data) {
      return res.status(400).json({ success: false, message: 'No data from Cashfree' });
    }

    const { order_status } = orderDetailsResponse.data;
    console.log('verifyPayment -> order_status:', order_status);

   
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
    console.log('Cashfree Callback:', req.body);
    const { order_id, order_status } = req.body;
    console.log('order_id from callback:', order_id);
    console.log('order_status from callback:', order_status);
    const order = await Order.findOne({ where: { cfOrderId: order_id } });
    if (!order) {
      console.error('Order not found:', order_id);
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
