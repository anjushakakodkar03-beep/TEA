const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Comment = sequelize.define(
    'Comment',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        post: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        author: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        text: {
            type: DataTypes.STRING(2000),
            allowNull: false
        }
    },
    {
        tableName: 'comments',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
);

module.exports = Comment;