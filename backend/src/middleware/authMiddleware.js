const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Not authorized, token missing.'
        });
    }

    try {
        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const [users] = await pool.execute(
            'SELECT id, name, username, email, phoneNo, role, createdAt, updatedAt FROM users WHERE id = ? LIMIT 1',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Not authorized, user not found.'
            });
        }

        req.user = users[0];

        return next();

    } catch (error) {
        return res.status(401).json({
            message: 'Not authorized, token invalid.'
        });
    }
};

module.exports = { protect };