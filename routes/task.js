const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all tasks for a user


// Delete all "done" tasks
router.delete('/done', auth(['parent']), async (req, res) => {
    try {
      const result = await Task.deleteMany({ user: req.user.id, status: 'done' });
      res.json({
        message: "All done tasks deleted",
        deletedCount: result.deletedCount,
      });
    } catch (err) {
      console.error("Error deleting all done tasks:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Delete a single task by ID
  router.delete('/:id', auth(['parent']), async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
  
      if (!task || task.user.toString() !== req.user.id) {
        return res.status(404).json({ message: "Task not found or unauthorized" });
      }
  
      await task.deleteOne(); // Corrected method
      res.json({ message: "Task deleted" });
    } catch (err) {
      console.error("Error deleting task:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  

// Create a new task
router.post('/', auth(['parent']), async (req, res) => {
  const { content, priority, status } = req.body;

  if (!content || !priority) {
    return res.status(400).json({ message: "Content and priority are required" });
  }

  try {
    const task = new Task({
      content,
      priority,
      status: status || 'to-do',
      user: req.user.id,
    });

    await task.save();
    res.json(task);
  } catch (err) {
    console.error("Error creating task:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a task
// Update a task
router.put('/:id', auth(['parent']), async (req, res) => {
    const { content, priority, status } = req.body;
  
    try {
      const task = await Task.findById(req.params.id);
  
      if (!task || task.user.toString() !== req.user.id) {
        return res.status(404).json({ message: "Task not found or unauthorized" });
      }
  
      // Update fields if they are provided
      if (content) task.content = content;
      if (priority) task.priority = priority;
      if (status) task.status = status;
  
      await task.save();
      console.log(`Task ${task.id} updated successfully:`, task);
      res.json(task);
    } catch (err) {
      console.error("Error updating task:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  });
  

// Delete a task

router.get('/', auth(['parent', 'admin']), async (req, res) => {
    console.log("Fetching tasks for user:", req.user.id);
    try {
      const tasks = await Task.find({ user: req.user.id });
      console.log("Tasks fetched successfully:", tasks);
      res.json(tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
module.exports = router;
