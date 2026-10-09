
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


const { connectDatabase } = require('./src/config/db');


const { connectSequelize } = require('./src/config/sequelize');

// Existing routes
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

// Existing error middleware
const {
    notFound,
    errorHandler
} = require('./src/middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Frontend build configuration
const frontendBuildPath = path.join(
    __dirname,
    '..',
    'frontend',
    'build'
);

const hasFrontendBuild = fs.existsSync(frontendBuildPath);


const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_NAME'
];

const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key]
);

if (missingEnvVars.length > 0) {
    console.error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );

    process.exit(1);
}

// Allowed frontend origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
];


app.use(
    cors({
        origin: allowedOrigins,
        credentials: true
    })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime()
    });
});


app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/profiles', profileRoutes);


if (hasFrontendBuild) {
    app.use(express.static(frontendBuildPath));

    app.get('*', (req, res) => {
        res.sendFile(
            path.join(frontendBuildPath, 'index.html')
        );
    });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server after both database connections succeed
const startServer = async () => {
    try {
        await connectDatabase();
        await connectSequelize();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(
            'Failed to start server:',
            error.message
        );

        process.exit(1);
    }
};

startServer();