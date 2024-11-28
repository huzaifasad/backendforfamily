const express = require('express');
const Task = require('../models/Task');
const Child = require('../models/Child');
const User = require('../models/User'); // Import User model
const auth = require('../middleware/auth');
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// const router = express.Router();

// **Cloudinary Configuration**
cloudinary.config({
  cloud_name:'dgmboslsv',
  api_key: '185184138269322',
  api_secret: 'tG0JzLrz7qWG1--RtgddznmLtPU',
});
console.log("Cloudinary configured successfully.");

// **Multer Cloudinary Storage**
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile-pictures", // Cloudinary folder where images will be stored
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    transformation: [{ width: 300, height: 300, crop: "fill" }], // Resize images to 300x300
  },
});
console.log("Multer storage configured with Cloudinary.");

const upload = multer({ storage }); // Initialize multer with the Cloudinary storage configuration
console.log("Multer initialized with Cloudinary storage.");

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
// Mark Task as Done
// Function to handle task completion and recurrence
// Function to calculate the next due date based on recurrence
// Helper function to calculate next recurrence date (1 minute for testing)

// Check if task is late and how many days it is overdue
// ... (keep existing imports)

// Helper function to calculate next recurrence date
const calculateNextDueDate = (recurrence, currentDueDate) => {
  const nextDueDate = new Date(currentDueDate);
  
  switch (recurrence) {
    case "daily":
      nextDueDate.setMinutes(nextDueDate.getMinutes() + 1); // Add 1 minute for testing daily recurrence
      break;
    case "weekly":
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case "monthly":
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
  }

  return nextDueDate;
};

// Update the completeTaskAndHandleRecurrence function
const completeTaskAndHandleRecurrence = async (taskId) => {
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return { message: 'Task not found' };
    }

    // Check if the task is late
    const currentDate = new Date();
    if (task.dueDate && new Date(task.dueDate) < currentDate && task.status !== 'done') {
      task.lateDays = Math.floor((currentDate - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
    }

    // Mark the task as done
    task.status = 'done';
    task.completedAt = new Date();
    await task.save();

    // Handle recurrence
    if (task.recurrence !== 'none') {
      const newTask = new Task({
        content: task.content,
        priority: task.priority,
        status: 'to-do',
        recurrence: task.recurrence,
        user: task.user,
        child: task.child,
        reward: task.reward,
        dueDate: calculateNextDueDate(task.recurrence, task.dueDate),
      });

      await newTask.save();
      console.log('New recurring task created:', newTask);
    }

    return { message: 'Task completed and recurring task created if applicable', task };
  } catch (error) {
    console.error('Error completing task and handling recurrence:', error.message);
    return { error: error.message };
  }
};

// Update the route to handle task completion
router.put('/child/tasks/:taskId/complete', childAuth, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const response = await completeTaskAndHandleRecurrence(taskId);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    return res.json({ message: response.message, task: response.task });
  } catch (error) {
    console.error('Error completing task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add a new route to check and update late tasks
router.get('/check-late-tasks', auth(['parent']), async (req, res) => {
  try {
    const currentDate = new Date();
    const lateTasks = await Task.find({
      status: 'to-do',
      dueDate: { $lt: currentDate }
    });

    for (const task of lateTasks) {
      task.lateDays = Math.floor((currentDate - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
      await task.save();
    }

    res.json({ message: 'Late tasks updated', count: lateTasks.length });
  } catch (error) {
    console.error('Error checking late tasks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ... (keep the rest of the existing code)



// router.put('/child/tasks/:taskId/complete', childAuth, async (req, res) => {
//   try {
//     // Find the task by its ID and ensure it's associated with the child making the request
//     const task = await Task.findOne({ _id: req.params.taskId, childId: req.user.id });
//     if (!task) return res.status(404).json({ message: 'Task not found' });

//     // Find the child associated with the task
//     const child = await Child.findById(task.child);
//     if (!child) return res.status(404).json({ message: 'Child not found' });

//     // Log the child's name
//     console.log(`Task completed by child: ${child.name}`);  // Print child's name

//     // Mark task as done and set the completion date
//     task.status = 'done';
//     task.completedAt = new Date();

//     // Add 10 points as a reward for completing the task
//     child.points += 10;  // Increase the child's points by 10
//     await child.save();  // Save the updated child object

//     // Log the updated points
//     console.log(`Added 10 points to child: ${child.name}. Total points: ${child.points}`);

//     // Save the task after updating its status
//     await task.save();

//     // Return the success response with task details
//     res.json({ message: 'Task marked as done and reward assigned', task });
//   } catch (error) {
//     console.error('Error completing task:', error.message);  // Log any error
//     res.status(500).json({ error: error.message });
//   }
// });





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
// Fetch tasks for child
router.get('/child/:childId/tasks', auth(['parent']), async (req, res) => {
  try {
    console.log('api called ')
    const { childId } = req.params;
    const today = new Date();

    // Get tasks and check if they are late
    const tasks = await Task.find({ child: childId }).populate('child', 'name');

    // Update late status
    const updatedTasks = tasks.map((task) => {
      if (task.dueDate && new Date(task.dueDate) < today && task.status !== 'done') {
        task.late = true;
        task.save(); // Save the late status
      }
      return task;
    });

    res.json(updatedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get Weekly Summary for Tasks
router.get('/weekly-summary', auth(['parent'],true), async (req, res) => {
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


router.post('/add-task', auth(['parent']), async (req, res) => {
  const { content, priority, dueDate, recurrence, childIds, forAllChildren, rewardPoints, predefinedRewardId } = req.body;

  try {
    const parent = await User.findById(req.user.id).populate('children');
    if (!parent) {
      console.error("Parent not found");
      return res.status(404).json({ message: "Parent not found." });
    }

    let targetChildren = [];
    if (forAllChildren) {
      targetChildren = parent.children.map(child => child._id);
    } else if (childIds && childIds.length > 0) {
      targetChildren = await Child.find({ _id: { $in: childIds }, parent: req.user.id });
    }

    if (targetChildren.length === 0) {
      return res.status(400).json({ message: "No children found to assign tasks." });
    }

    const tasks = await Promise.all(
      targetChildren.map(childId => {
        const newTask = new Task({
          content,
          priority,
          dueDate,
          recurrence,
          child: childId,
          user: req.user.id,
          reward: {
            points: rewardPoints || 0, // Assign reward points (if any)
            predefinedReward: predefinedRewardId || null, // Assign predefined reward (if any)
          }
        });
        return newTask.save();
      })
    );

    res.status(201).json({ message: "Tasks added successfully", tasks });
  } catch (error) {
    console.error("Error adding tasks:", error.message);
    res.status(500).json({ error: error.message });
  }
});






router.post('/add', auth(['parent'],true), async (req, res) => {
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
router.get('/:childId', auth(['parent'],true), async (req, res) => {
  try {
    console.log('wer are in cchild')
    const tasks = await Task.find({ child: req.params.childId }).populate('child', 'name');
    console.log("Tasks ",tasks)
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

// Update Task Status
// Update task status to 'done'
// Update task status to 'done'
router.put('/:taskId', auth(['parent'], true), async (req, res) => {
  const { status } = req.body; // The status should be 'done' in your case
  console.log('We are in the task update state');  // Debug log
  try {
    // Fetch the task by ID
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the task belongs to the current user (parent)
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this task' });
    }

    // Ensure the task status is being updated to 'done'
    if (status !== 'done') {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    // Mark the task as done
    task.status = status;
    await task.save();  // Save the task with updated status

    // Find the child associated with the task
    const child = await Child.findById(task.child);
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Add 10 reward points to the child
    child.points += 10;  // Add 10 points to the child's reward points
    await child.save();  // Save the updated child document

    // Log the updated child details
    console.log(`Task completed by child:`);
    console.log(`Child Name: ${child.name}`);
    console.log(`Child ID: ${child._id}`);
    console.log(`Total Points (after task completion): ${child.points}`);

    res.status(200).json({ message: 'Task status updated and reward assigned', task, child });
  } catch (error) {
    console.error('Error updating task:', error.message);
    res.status(500).json({ error: error.message });
  }
});



// Delete Task
router.delete('/:taskId', auth(['parent'],true), async (req, res) => {
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
router.delete('/:childId/delete-completed', auth(['parent'],true), async (req, res) => {
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
  router.post(
    "/add-childx",
    auth(["parent"]),
    upload.single("profilePicture"),
    async (req, res) => {
      const { name, email, password, dob, grade } = req.body;
  
      try {
        console.log("Add Child Request Received:", req.body);
  
        const parent = await User.findById(req.user.id);
        if (!parent) {
          console.error("Parent not found");
          return res.status(404).json({ message: "Parent not found" });
        }
  
        // Check if a child with the given email already exists
        const existingChild = await Child.findOne({ email });
        if (existingChild) {
          console.error("Child with this email already exists");
          return res.status(400).json({ message: "Child with this email already exists" });
        }
  
        // Create the child
        const child = new Child({
          name,
          email,
          password,
          dob,
          grade,
          parent: req.user.id,
          parentUsername: parent.email,
          profilePicture: req.file ? req.file.path : null,
        });
  
        await child.save();
  
        // Add the child's ID to the parent's `children` array
        parent.children.push(child._id);
        await parent.save();
  
        console.log("Child created and linked to parent:", child);
        res.status(201).json({ message: "Child added successfully", child });
      } catch (error) {
        console.error("Error adding child:", error.message);
        res.status(500).json({ error: error.message });
      }
    }
  );
  

module.exports = router;
