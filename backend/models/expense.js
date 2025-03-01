import { DataTypes } from 'sequelize';
import  sequelize  from '../config/database.js'; 

const Expense = sequelize.define('Expense', {
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
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type:DataTypes.ENUM('income', 'expense')
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
}, {
    timestamps: true
});

export default Expense;
