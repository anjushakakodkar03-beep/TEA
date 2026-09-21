const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const generateToken = require('../utils/generateToken');

const buildAuthResponse = (user) => ({
    _id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phoneNo: user.phoneNo,
    role: user.role,
    token: generateToken(user.id),
});

const registerUser = async (req, res, next) => {
    try {
        const { username, email, password, phoneNo, name } = req.body;
        const finalName = name || username;

        if (!username || !email || !password || !phoneNo || !finalName) {
            return res.status(400).json({
                message: 'username, email, password, and phoneNo are required.'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedUsername = String(username).trim();

        // Check if email already exists
        const [existingByEmail] = await pool.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [normalizedEmail]
        );

        if (existingByEmail.length > 0) {
            return res.status(400).json({
                message: 'User already exists.'
            });
        }

        // Check if username already exists
        const [existingByUsername] = await pool.execute(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [normalizedUsername]
        );

        if (existingByUsername.length > 0) {
            return res.status(400).json({
                message: 'Username already exists.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.execute(
            `INSERT INTO users
            (name, username, phoneNo, email, password, role)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                String(finalName).trim(),
                normalizedUsername,
                String(phoneNo).trim(),
                normalizedEmail,
                hashedPassword,
                'user'
            ]
        );

        // Get newly created user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ? LIMIT 1',
            [result.insertId]
        );

        const user = users[0];

        return res.status(201).json(buildAuthResponse(user));

    } catch (error) {
        return next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // Find user by email
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // Compare password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        return res.json(buildAuthResponse(user));

    } catch (error) {
        return next(error);
    }
};

const getProfile = async (req, res) => {
    res.json(req.user);
};

module.exports = {
    registerUser,
    loginUser,
    getProfile
};