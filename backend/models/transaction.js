import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Category from './category.js';

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        
    },
    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
}, {
    timestamps: true
});

export default Transaction;
