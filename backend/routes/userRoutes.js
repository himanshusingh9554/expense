import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import User from '../models/user.js';

const router = express.Router();


router.get('/user', authenticateUser, async (req, res) => {
  try {

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email','premium']
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      name: user.name,
      premium: user.premium
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
