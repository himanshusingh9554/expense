import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import Transaction from "../models/transaction.js"; // or Expense, if you store all in Expense
import { Op } from "sequelize";
import Expense from "../models/expense.js";
const router = express.Router();

// GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // Build where condition
    const whereCondition = { userId };
    if (startDate && endDate) {
      whereCondition.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereCondition.date = { [Op.gte]: startDate };
    } else if (endDate) {
      whereCondition.date = { [Op.lte]: endDate };
    }

    // 1) Fetch all transactions/expenses for user within date range
    const transactions = await Transaction.findAll({ where: whereCondition });

    // 2) Sum up income vs expense
    let income = 0;
    let expenses = 0;
    transactions.forEach((tx) => {
      if (tx.type === "income") {
        income += tx.amount;
      } else {
        expenses += tx.amount;
      }
    });
    const fetchedExpenses = await Expense.findAll({ where: whereCondition });

   
    fetchedExpenses.forEach((item) => {
      if (item.type === "income") {
        income += item.amount;
      } else if (item.type === "expense") {
        expenses += item.amount;
      }
    });

    return res.json({
      success: true,
      income,
      expenses
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ success: false, message: "Error generating report" });
  }
});

export default router;
