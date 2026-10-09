require('dotenv').config();

const { sequelize } = require('./src/config/sequelize');
const { User, Post, Comment, Follow } = require('./src/models');

async function Models() {
    try {
        await sequelize.authenticate();

        console.log('Sequelize connection successful');

        const models = { User, Post, Comment, Follow };

        for (const [name, model] of Object.entries(models)) {
            await model.describe();
            console.log(`${name} model matches its database table`);
        }

        console.log('All four models tested successfully');
    } catch (error) {
        console.error('Model test failed:', error.message);
    } finally {
        await sequelize.close();
    }
}

Models();