const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const Child = require('../models/Child');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 1. Parent Login
router.post('/parent/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Parent login request received:", { email });

    try {
        const user = await User.findOne({ email, role: 'parent' });
        console.log("Parent user found:", user);

        if (!user || user.password !== password) {
            console.error("Invalid credentials for user:", { email });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: 'parent' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log("JWT token generated for user:", { userId: user._id });

        res.json({ token, user });
    } catch (error) {
        console.error('Error in parent login:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get All Children of a Parent
router.get('/parent/children', auth(['parent']), async (req, res) => {
    console.log("Fetching children for parent:", req.user.id);

    try {
        const children = await Child.find({ parent: req.user.id }).select('-password');
        console.log("Children fetched:", children);

        res.json(children);
    } catch (error) {
        console.error('Error fetching children:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 3. Get All Tasks for a Child
router.get('/parent/children', auth(['parent']), async (req, res) => {
    console.log("Fetching children for parent:", req.user.id);

    try {
        const children = await Child.find({ parent: req.user.id }).select('-password');
        console.log("Children fetched for parent:", req.user.id, children);

        res.json(children);
    } catch (error) {
        console.error('Error fetching children:', error.message);
        res.status(500).json({ error: error.message });
    }
});


// 4. Update Task Status
router.put('/parent/tasks/:taskId', auth(['parent']), async (req, res) => {
    const { status } = req.body;
    console.log("Updating task status:", { taskId: req.params.taskId, status });

    try {
        const task = await Task.findById(req.params.taskId);
        console.log("Task found for update:", task);

        if (!task) {
            console.error("Task not found:", { taskId: req.params.taskId });
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = status;
        task.completedAt = status === 'done' ? new Date() : null;
        await task.save();

        console.log("Task updated successfully:", task);
        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 5. Get Rewards for a Child
router.get('/parent/child/:childId/rewards', auth(['parent']), async (req, res) => {
    console.log("Fetching rewards for child:", req.params.childId);

    try {
        const child = await Child.findById(req.params.childId).populate('rewards');
        console.log("Child fetched with rewards:", child);

        if (!child) {
            console.error("Child not found:", { childId: req.params.childId });
            return res.status(404).json({ message: 'Child not found' });
        }

        res.json(child.rewards);
    } catch (error) {
        console.error('Error fetching rewards:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 6. Assign Task to a Child
router.post('/parent/child/:childId/tasks', auth(['parent']), async (req, res) => {
    const { content, priority, dueDate } = req.body;
    console.log("Assigning task to child:", { childId: req.params.childId, content, priority, dueDate });

    try {
        const child = await Child.findById(req.params.childId);
        console.log("Child found for task assignment:", child);

        if (!child) {
            console.error("Child not found:", { childId: req.params.childId });
            return res.status(404).json({ message: 'Child not found' });
        }

        const task = new Task({
            content,
            priority,
            dueDate,
            child: req.params.childId,
            user: req.user.id,
        });
        await task.save();

        console.log("Task assigned successfully:", task);
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
