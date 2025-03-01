import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import Transaction from '../models/transaction.js'

const router = express.Router();

router.post('/transactions', authenticateUser, async (req, res) => {
    try {
        const {name, amount, categoryId, type, description, date  } = req.body;
        const userId = req.user.id; 

        if (!name || !amount || !categoryId || !type || !date) {
            return res.status(400).json({ error: 'Name, amount, category, type and date are required.' });
        }

        const transaction = await Transaction.create({ 
            userId,
            name,
            categoryId,
            type,
            amount,
            description,
            date
        });

        res.status(201).json({ message: 'Transaction saved successfully', data: transaction });
    } catch (error) {
        console.error('Error saving transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/transactions', authenticateUser, async (req, res) => {
    try {
        const transactions = await Transaction.findAll({ where: { userId: req.user.id } });

        res.status(200).json({ message: 'Transactions retrieved successfully', data: transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.delete('/transactions/:id', authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id; 
      const transaction = await Transaction.findByPk(id);
      if (!transaction || transaction.userId !== userId) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      await transaction.destroy();
      res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.put('/transactions/:id', authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, amount, categoryId, type, description, date } = req.body;
      const userId = req.user.id;
      const transaction = await Transaction.findByPk(id);
      if (!transaction || transaction.userId !== userId) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      transaction.name = name;
      transaction.amount = amount;
      transaction.categoryId = categoryId;
      transaction.type = type;
      transaction.description = description;
      transaction.date = date;
      await transaction.save();
      res.status(200).json({ message: "Transaction updated successfully", data: transaction });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  });


export default router;
