import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
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
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESSFUL', 'FAILED'),
    defaultValue: 'PENDING'
  },
  cfOrderId: {  
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  paymentSessionId: {  
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true
});

export default Order;
