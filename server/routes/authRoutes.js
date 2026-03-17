import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'arogyaconnect_secret', { expiresIn: '30d' });
};

// @desc Register User
// @route POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role, profile } = req.body;
    console.log(`📝 Registration Request: ${email} as ${role}`);
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.warn(`⚠️ User already exists: ${email}`);
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role, profile });
        console.log(`✅ User Registered: ${user.email} (${user.role})`);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(`❌ Registration Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
});

// @desc Auth User & get token
// @route POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`🔑 Login Request: ${email}`);
    try {
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            console.log(`✅ Login Successful: ${email}`);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: user.profile,
                token: generateToken(user._id)
            });
        } else {
            console.warn(`⚠️ Login Failed: ${email}`);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(`❌ Login Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;
