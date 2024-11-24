const express = require('express');
const Task = require('../models/Task');
const Child = require('../models/Child');
const User = require('../models/User'); // Import User model
const auth = require('../middleware/auth');

const router = express.Router();
// Middleware to verify child login
const childAuth = auth(['child']);

// Get Child Info (for Dashboard)
router.get('/child/info', childAuth, async (req, res) => {
  try {
    const child = await Child.findById(req.user.id);
    if (!child) return res.status(404).json({ message: 'Child not found' });
    res.json(child);
  } catch (error) {
    console.error('Error fetching child info:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get Child's Tasks
router.get('/child/tasks', childAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ childId: req.user.id });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mark Task as Done
router.put('/child/tasks/:taskId/complete', childAuth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, childId: req.user.id },
      { status: 'done' },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task marked as done', task });
  } catch (error) {
    console.error('Error completing task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add Comment to a Task
router.post('/child/tasks/:taskId/comment', childAuth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, childId: req.user.id },
      { $push: { comments: req.body.comment } },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Comment added', task });
  } catch (error) {
    console.error('Error adding comment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add Child
// Get Weekly Summary for Tasks
router.get('/weekly-summary', auth(['parent']), async (req, res) => {
  try {
    console.log('we are in the weekly summary ')
    const { childId } = req.query; // Allow filtering by child ID if needed
    const startOfWeek = new Date(); // Set start of the week (Sunday by default)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(); // Set end of the week (Saturday by default)
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Query tasks for the week
    const query = {
      user: req.user.id, // Ensure the tasks belong to the authenticated parent
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    };

    if (childId) {
      query.child = childId; // Filter by child ID if provided
    }

    const tasks = await Task.find(query)
      .populate('child', 'name') // Populate child info if needed
      .sort({ createdAt: 1 }); // Sort by creation date

    // Group tasks by day
    const summary = tasks.reduce((acc, task) => {
      const taskDate = task.createdAt.toISOString().split('T')[0]; // Format date (YYYY-MM-DD)
      if (!acc[taskDate]) acc[taskDate] = [];
      acc[taskDate].push(task);
      return acc;
    }, {});
      // Log the summary to the console in a readable format
      console.log('Weekly Summary:');
      for (const [date, tasksOnDate] of Object.entries(summary)) {
        console.log(`Date: ${date}`);
        tasksOnDate.forEach((task, index) => {
          console.log(`  Task ${index + 1}: ${task.name} - ${task.createdAt}`);
        });
      }
  
    console.log({ message: 'Weekly summary fetched successfully', summary })
    res.json({ message: 'Weekly summary fetched successfully', summary });
  } catch (error) {
    console.error('Error fetching weekly summary:', error.message);
    res.status(500).json({ message: 'Failed to fetch weekly summary', error: error.message });
  }
});

// Add Task for a Child
router.post('/add', auth(['parent']), async (req, res) => {
    const { content, priority, childId } = req.body;
  
    console.log("Add Task Request Received: ", req.body);
  
    // Validate the request
    if (!content || !priority || !childId) {
      return res.status(400).json({ message: "All fields are required: content, priority, childId." });
    }
  
    try {
      // Check if the child exists
      const child = await Child.findById(childId);
      if (!child) {
        console.log("Child not found for ID:", childId);
        return res.status(404).json({ message: "Child not found." });
      }
  
      // Ensure the child belongs to the authenticated parent
      if (child.parent.toString() !== req.user.id) {
        console.log("Unauthorized access to child:", childId);
        return res.status(403).json({ message: "Unauthorized to assign tasks to this child." });
      }
  
      // Create a new task
      const task = new Task({
        content,
        priority,
        child: childId,
        user: req.user.id,
      });
  
      await task.save();
      console.log("Task created successfully:", task);
  
      res.status(201).json({ message: "Task added successfully", task });
    } catch (error) {
      console.error("Error adding task:", error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
router.post('/add', auth(['parent']), async (req, res) => {
    const { name, email, password, dob, grade } = req.body;
  
    console.log("Add Child Request Received: ", req.body);
  
    try {
      // Fetch the parent information
      const parent = await User.findById(req.user.id);
      if (!parent) {
        console.log("Parent not found");
        return res.status(404).json({ message: 'Parent not found' });
      }
      console.log("Parent found: ", parent);
  
      // Check if a child with the same email already exists
      const existingChild = await Child.findOne({ email });
      if (existingChild) {
        console.log("Child with this email already exists");
        return res.status(400).json({ message: 'Child with this email already exists' });
      }
  
      // Create a new child record
      const child = new Child({
        name,
        email,
        password, // Store the password from the request
        dob,
        grade,
        parent: req.user.id,
        parentUsername: parent.email, // Use the parent's email as the username
      });
      await child.save();
  
      console.log("Child created: ", child);
      res.status(201).json({ message: 'Child added successfully', child });
    } catch (error) {
      console.error("Error adding child: ", error.message);
      res.status(500).json({ error: error.message });
    }
  });
  

// Get All Tasks for a Child
router.get('/:childId', auth(['parent']), async (req, res) => {
  try {
    const tasks = await Task.find({ child: req.params.childId }).populate('child', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

// Update Task Status
router.put('/:taskId', auth(['parent']), async (req, res) => {
  const { status } = req.body;

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this task' });
    }

    task.status = status;
    await task.save();

    res.status(200).json({ message: 'Task status updated', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Task
router.delete('/:taskId', auth(['parent']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.taskId);

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Delete All Completed Tasks for a Child
router.delete('/:childId/delete-completed', auth(['parent']), async (req, res) => {
    try {
      const tasks = await Task.find({ child: req.params.childId, status: "done" });
  
      if (!tasks.length) {
        return res.status(404).json({ message: "No completed tasks found." });
      }
  
      // Ensure the tasks belong to the authenticated parent's child
      const child = await Child.findById(req.params.childId);
      if (!child || child.parent.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete these tasks." });
      }
  
      await Task.deleteMany({ child: req.params.childId, status: "done" });
      res.status(200).json({ message: "All completed tasks deleted successfully." });
    } catch (error) {
      console.error("Error deleting completed tasks:", error.message);
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/add-childx', auth(['parent']), async (req, res) => {
    const { name, email, password, dob, grade } = req.body;
  
    console.log("Add Child Request Received: ", req.body);
  
    try {
      // Fetch the parent information
      const parent = await User.findById(req.user.id);
      if (!parent) {
        console.log("Parent not found");
        return res.status(404).json({ message: 'Parent not found' });
      }
  
      console.log("Parent found: ", parent);
  
      // Check if a child with the same email already exists
      const existingChild = await Child.findOne({ email });
      if (existingChild) {
        console.log("Child with this email already exists");
        return res.status(400).json({ message: 'Child with this email already exists' });
      }
  
      // Create a new child record
      const child = new Child({
        name,
        email,
        password, // Store the password from the request
        dob,
        grade,
        parent: req.user.id,
        parentUsername: parent.email, // Use the parent's email as the username
      });
      await child.save();
  
      console.log("Child created: ", child);
      res.status(201).json({ message: 'Child added successfully', child });
    } catch (error) {
      console.error("Error adding child: ", error.message);
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
