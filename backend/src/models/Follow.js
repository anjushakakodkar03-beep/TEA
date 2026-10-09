const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Follow = sequelize.define(
    'Follow',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        follower_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        following_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        tableName: 'follows',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false
    }
);

module.exports = Follow;