
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Not authorized, token missing.',
        });
    }

    try {
        const token = authHeader.split(' ')[1];

        // Verify the JWT token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Check whether the token contains a user ID
        if (!decoded.userId) {
            return res.status(401).json({
                message: 'Not authorized, user ID missing from token.',
            });
        }

        // Fetch the user using the ID stored in the token
        const [users] = await pool.execute(
            `SELECT id, name, username, email, phoneNo, role,
                    bio, profilePic, createdAt, updatedAt
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Not authorized, user not found.',
            });
        }

        // Attach the logged-in user to the request
        req.user = users[0];

        return next();

    } catch (error) {
        console.error('Authentication error:', error);

        return res.status(401).json({
            message: 'Not authorized, token invalid or authentication failed.',
        });
    }
};

module.exports = { protect };