
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'Blog_app',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'Anjush@03',
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        dialect: 'mysql',
        logging: false
    }
);

const connectSequelize = async () => {
    try {
        await sequelize.authenticate();

        console.log('Sequelize connected successfully');
        console.log(
            `Sequelize database: ${process.env.DB_NAME || 'Blog_app'}`
        );
    } catch (error) {
        console.error(
            'Sequelize connection failed:',
            error.message
        );

        throw error;
    }
};

module.exports = {
    sequelize,
    connectSequelize
};