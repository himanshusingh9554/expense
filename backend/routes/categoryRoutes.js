import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import Category from '../models/category.js';

const router = express.Router();

// ✅ Create a category
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { name, type } = req.body;
        const userId = req.user.id;

        const category = await Category.create({ userId, name, type });

        res.status(201).json({ message: 'Category created successfully', data: category });
    } catch (error) {
        res.status(500).json({ error: 'Error creating category', message: error.message });
    }
});

// ✅ Get all categories for user
router.get('/categories', authenticateUser, async (req, res) => {
    try {
        const categories = await Category.findAll({ where: { userId: req.user.id } });

        res.status(200).json({ message: 'Categories retrieved successfully', data: categories });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching categories', message: error.message });
    }
});

export default router;
