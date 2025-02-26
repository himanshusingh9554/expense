import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import User from '../models/user.js';

const router = express.Router();

// GET /api/user
router.get('/user', authenticateUser, async (req, res) => {
  try {
    // req.user.id is set by authenticateUser
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email']
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return the user object
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
