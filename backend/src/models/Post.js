const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Post = sequelize.define(
    'Post',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        author: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        subtitle: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        vibeColor: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: '#ffffff'
        },
        blogType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: 'post'
        },
        alignment: {
            type: DataTypes.ENUM('left', 'center', 'right', 'justify'),
            allowNull: true,
            defaultValue: 'center'
        },
        imageUrl: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },
        contentJson: {
            type: DataTypes.JSON,
            allowNull: true
        },
        overlays: {
            type: DataTypes.JSON,
            allowNull: true
        }
    },
    {
        tableName: 'posts',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
);

module.exports = Post;