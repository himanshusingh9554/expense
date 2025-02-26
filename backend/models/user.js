import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    premium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }, resetToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true
      }
      
}, {
    timestamps: true
});

export default User;
