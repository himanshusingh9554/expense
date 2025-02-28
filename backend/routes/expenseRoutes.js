import express from 'express';
import  {authenticateUser}  from '../middleware/authMiddleware.js';
import { createExpense, getExpenses, updateExpense, deleteExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.post('/expenses', authenticateUser, createExpense);
router.get('/expenses', authenticateUser, getExpenses);
router.put('/expenses/:id', authenticateUser, updateExpense);
router.delete('/expenses/:id', authenticateUser, deleteExpense); 

export default router;
