const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Project, Bug } = require('./schema');

// Middleware to authenticate and set req.user
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(decoded);
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
}

// POST route to create a new bug
router.post('/report', authenticate, async (req, res) => {
    try {
        const { projectId, assignedTo, priority, severity, stepsToReproduce, image, deadline, status, comments } = req.body;

        const newBug = new Bug({
            projectId,
            reportedBy: req.user.userId, 
            assignedTo,
            priority,
            severity,
            stepsToReproduce,
            image,
            deadline,
            status,
            comments
        });

        await newBug.save();
        res.status(201).send(newBug);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


// GET route to retrieve all bugs
router.get('/all', async (req, res) => {
    try {
        const bugs = await Bug.find();
        res.status(200).send(bugs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// GET route to retrieve all bugs assigned to the authenticated user
router.get('/mybugs', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const assignedBugs = await Bug.find({ assignedTo: userId }).populate('projectId', 'name');

        res.status(200).send(assignedBugs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// GET route to retrieve a specific bug by ID
router.get('/:id', async (req, res) => {
    try {
        const bug = await Bug.findById(req.params.id);
        if (!bug) {
            return res.status(404).send('Bug not found');
        }
        res.status(200).send(bug);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


// PUT route to update a bug
router.put('/update/:id', async (req, res) => {
    try {
        const bug = await Bug.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bug) {
            return res.status(404).send('Bug not found');
        }
        res.status(200).send(bug);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// DELETE route to delete a bug
router.delete('/delete/:id', async (req, res) => {
    try {
        const bug = await Bug.findByIdAndDelete(req.params.id);
        if (!bug) {
            return res.status(404).send('Bug not found');
        }
        res.status(200).send('Bug deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
