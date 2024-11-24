const express = require('express');
const Task = require('../models/Task');
const authx = require('../middleware/childauth');
const router = express.Router();

// Middleware to verify child login
const childAuth = authx(['child']);

// 1. Get All Tasks for the Logged-In Child
router.get('/tasks', childAuth, async (req, res) => {
    console.log('Child ID from Token:', req.user.id);
    try {
        const tasks = await Task.find({ child: req.user.id }).sort({ createdAt: -1 });
        console.log('Fetched Tasks:', tasks);

        if (tasks.length === 0) {
            console.log('No tasks found for this child.');
        }

        res.status(200).json({ message: 'Tasks fetched successfully', tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error.message);
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
});

// 2. Get Completed Tasks for the Logged-In Child
router.get('/tasks/completed', childAuth, async (req, res) => {
    console.log(`Request to fetch completed tasks for childId: ${req.user.id}`);
    try {
        const tasks = await Task.find({ childId: req.user.id, status: 'done' }).sort({ updatedAt: -1 });
        console.log(`Completed tasks fetched successfully for childId: ${req.user.id}`, tasks);

        if (tasks.length === 0) {
            console.log('No completed tasks found for this child.');
        }

        res.status(200).json({ message: 'Completed tasks fetched successfully', tasks });
    } catch (error) {
        console.error('Error fetching completed tasks:', error.message);
        res.status(500).json({ message: 'Error fetching completed tasks', error: error.message });
    }
});

// 3. Get Pending (Not Completed) Tasks for the Logged-In Child
router.get('/tasks/pending', childAuth, async (req, res) => {
    console.log(`Request to fetch pending tasks for childId: ${req.user.id}`);
    try {
        const tasks = await Task.find({ childId: req.user.id, status: { $ne: 'done' } }).sort({ createdAt: -1 });
        console.log(`Pending tasks fetched successfully for childId: ${req.user.id}`, tasks);

        if (tasks.length === 0) {
            console.log('No pending tasks found for this child.');
        }

        res.status(200).json({ message: 'Pending tasks fetched successfully', tasks });
    } catch (error) {
        console.error('Error fetching pending tasks:', error.message);
        res.status(500).json({ message: 'Error fetching pending tasks', error: error.message });
    }
});

// 4. Mark a Task as Completed
router.put('/tasks/:taskId/complete', childAuth, async (req, res) => {
  const mongoose = require('mongoose');
  
  try {
      // Convert `req.user.id` to ObjectId
      const childId = new mongoose.Types.ObjectId(req.user.id); // Correct usage
      console.log('Child ID:', childId);

      // Find and update the task
      const task = await Task.findOneAndUpdate(
          { _id: req.params.taskId, child: childId },
          { status: 'done' },
          { new: true }
      );

      if (!task) {
          console.log('Task not found or unauthorized access', { taskId: req.params.taskId, childId });
          return res.status(404).json({ message: 'Task not found or unauthorized access' });
      }

      console.log('Updated Task:', task);
      res.status(200).json({ message: 'Task marked as completed', task });
  } catch (error) {
      console.error('Error marking task as completed:', error.message);
      res.status(500).json({ message: 'Error marking task as completed', error: error.message });
  }
});


// 5. Add Comment to a Task
router.post('/tasks/:taskId/comment', childAuth, async (req, res) => {
    console.log(`Request to add comment to taskId: ${req.params.taskId}, childId: ${req.user.id}`);
    try {
        const { comment } = req.body;
        if (!comment) {
            console.log(`Empty comment received for taskId: ${req.params.taskId}`);
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        const task = await Task.findOneAndUpdate(
            { _id: req.params.taskId, childId: req.user.id },
            { $push: { comments: comment } },
            { new: true }
        );

        if (!task) {
            console.log(`Task not found or unauthorized access for taskId: ${req.params.taskId}`);
            return res.status(404).json({ message: 'Task not found or unauthorized access' });
        }

        console.log(`Comment added to taskId: ${req.params.taskId}`, task);
        res.status(200).json({ message: 'Comment added successfully', task });
    } catch (error) {
        console.error('Error adding comment to task:', error.message);
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
});

// 6. Delete a Task (Optional, if allowed for children)
router.delete('/tasks/:taskId', childAuth, async (req, res) => {
    console.log(`Request to delete task for taskId: ${req.params.taskId}, childId: ${req.user.id}`);
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.taskId, childId: req.user.id });

        if (!task) {
            console.log(`Task not found or unauthorized access for taskId: ${req.params.taskId}`);
            return res.status(404).json({ message: 'Task not found or unauthorized access' });
        }

        console.log(`Task deleted successfully for taskId: ${req.params.taskId}`, task);
        res.status(200).json({ message: 'Task deleted successfully', task });
    } catch (error) {
        console.error('Error deleting task:', error.message);
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});

module.exports = router;
