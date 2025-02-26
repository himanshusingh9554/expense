import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js';
import cron from 'node-cron';
import {sendEmail} from './utils/sendEmail.js';
import Expense from './models/expense.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
// ...



cron.schedule('0 8 * * *', async () => {
    const expenses = await Expense.findAll({
        where: { date: new Date().toISOString().split('T')[0] }
    });

    for (const expense of expenses) {
        await sendEmail(expense.user.email, "Expense Reminder", `You have an upcoming expense: ${expense.description}`);
    }
});

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors());
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins (or specify your frontend domain)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log("CF_CLIENT_ID:", process.env.CF_CLIENT_ID);
console.log("CF_CLIENT_ID:", process.env.CF_CLIENT_SECRET);

console.log("CF_MODE:", process.env.CF_MODE);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api', transactionRoutes);
app.use('/api', expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use('/api', userRoutes);
app.use('/api/orders', orderRoutes);

app.use(express.static(path.join(__dirname, '../public')));
// Database Connection
app.use('/api/categories', categoryRoutes);
sequelize.sync({ force: true})
    .then(() => console.log('Database connected'))
    .catch(err => console.error('DB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
