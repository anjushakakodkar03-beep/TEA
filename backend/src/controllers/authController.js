
const bcrypt = require('bcryptjs');
const { User } = require('../models');
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

        
        const existingByEmail = await User.findOne({
            where: { email: normalizedEmail }
        });

        if (existingByEmail) {
            return res.status(400).json({
                message: 'User already exists.'
            });
        }

        
        const existingByUsername = await User.findOne({
            where: { username: normalizedUsername }
        });

        if (existingByUsername) {
            return res.status(400).json({
                message: 'Username already exists.'
            });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        
        const user = await User.create({
            name: String(finalName).trim(),
            username: normalizedUsername,
            phoneNo: String(phoneNo).trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user'
        });

        return res.status(201).json(buildAuthResponse(user));
    } catch (error) {
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'User or username already exists.'
            });
        }

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

        
        const user = await User.findOne({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        
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
    return res.json(req.user);
};

module.exports = {
    registerUser,
    loginUser,
    getProfile
};

