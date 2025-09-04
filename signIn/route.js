const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const router = express.Router();

dotenv.config();


const adminEmail = "abc@gmail.com"
const adminPassword = "admin123"
const JWT_SECRET = process.env.JWT_SECRET_KEY;

router.get('/signin', (req, res) => {
    res.send('Sign-in Page');
});

router.post('/signin', (req, res) => {
    const { email, password } = req.body;

    if (email === adminEmail && password === adminPassword) {
        const token = jwt.sign({ email: adminEmail, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Sign-in successful', token, success: true });
    } else {
        res.status(401).json({ message: 'Invalid email or password', success: false });
    }
});

module.exports = router;