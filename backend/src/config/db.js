const mongoose = require('mongoose');

const connectDatabase = async () => {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
};

module.exports = { connectDatabase };

