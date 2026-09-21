const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDatabase } = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const commentRoutes = require('./src/routes/commentRoutes');

const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');



const app = express();
const PORT = process.env.PORT || 5000;

const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
const hasFrontendBuild = fs.existsSync(frontendBuildPath);

const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_NAME'
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
                return callback(null, true);
            }
            return callback(new Error('CORS not allowed for this origin.'));
        },
        credentials: true
    })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

if (hasFrontendBuild) {
    app.use(express.static(frontendBuildPath));
    app.get('*', (req, res) => res.sendFile(path.join(frontendBuildPath, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
    await connectDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

