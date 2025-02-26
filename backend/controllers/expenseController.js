import Expense from "../models/expense.js"

// ✅ Create Expense
export const createExpense = async (req, res) => {
    try {
        const { name,amount, category, type, date } = req.body;
        const expense = await Expense.create({ 
            name,
            amount, 
            category, 
            type, 
            date,
            userId: req.user.id 
        });
        res.status(201).json({ success: true, message: 'Expense added', data: expense });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding expense', error: error.message });
    }
};

// ✅ Get Expenses
export const getExpenses = async (req, res) => {
    try {
      // 1) Read page & limit from query; defaults if missing
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
  
      // 2) Count total expenses for this user
      const totalCount = await Expense.count({
        where: { userId: req.user.id }
      });
  
      // 3) Fetch expenses with offset & limit
      const expenses = await Expense.findAll({
        where: { userId: req.user.id },
        offset,
        limit,
        order: [['createdAt', 'DESC']]
      });
  
      // 4) Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);
  
      // 5) Return the data + pagination info
      res.json({
        success: true,
        data: expenses,
        currentPage: page,
        totalPages,
        rowsPerPage: limit,
        totalCount
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  

// ✅ Update Expense (Edit)
export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, description, date } = req.body;

        let expense = await Expense.findOne({ where: { id, userId: req.user.id } });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        expense.amount = amount;
        expense.category = category;
        expense.description = description;
        expense.date = date;
        
        await expense.save();

        res.status(200).json({ success: true, message: 'Expense updated successfully', data: expense });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating expense', error: error.message });
    }
};

// ✅ Delete Expense
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        let expense = await Expense.findOne({ where: { id, userId: req.user.id } });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        await expense.destroy();

        res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting expense', error: error.message });
    }
};