const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./schema').User;
const router = express.Router();
const jwt = require('jsonwebtoken');


// Registration Route
router.post('/register', async (req, res) => {
    try {
        // Get user input
        const { username, password, name, role, developerType } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).send('User already exists');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const user = new User({
            username,
            password: hashedPassword,
            name,
            role,
            developerType
        });

        // Save the user
        await user.save();

        // Send success response (avoid sending sensitive info like password)
        res.status(201).send({ id: user._id, username, name, role, developerType });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, register');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // Include additional user info in the token
        const tokenPayload = {
            userId: user._id,
            role: user.role,
            developerType: user.developerType
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error, login');
    }
});



module.exports = router;
