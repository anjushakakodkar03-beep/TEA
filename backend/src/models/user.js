const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        phoneNo: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            allowNull: true,
            defaultValue: 'user'
        }
    },
    {
        tableName: 'users',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false
    }
);

module.exports = User;