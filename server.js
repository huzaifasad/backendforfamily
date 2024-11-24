const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile'); // New profile routes
const childRoutes = require('./routes/child'); // Updated child routes
const task=require('./routes/task')
const bodyParser = require('body-parser');
const cors = require('cors');
const Child = require('./models/Child'); // Ensure the path to your Child model is correct

const childTaskRoutes = require('./routes/childTask');
const rewardRoutes = require('./routes/reward');
const mealRoutes = require("./routes/meal");
const recipeRoutes = require("./routes/recipe");
const calendarRoutes = require("./routes/calendar"); // Import calendar routes
const stripeRoutes = require("./routes/stripe");
const childAuth =require('./routes/ChildAuth')
const childtaskdash=require('./routes/childdashboaard')
// const financeRoutes = require("./routes/finance");
const finance =require('./routes/finance');


// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/children', childRoutes);
app.use('/api/parent/tast',task)
app.use('/api/child-tasks', childTaskRoutes);
app.use('/api/rewards', rewardRoutes);
app.use("/api/meal", mealRoutes);
app.use("/api/recipe", recipeRoutes);
app.use("/api/finance", finance);
app.use("/api/calendar", calendarRoutes); // Mount calendar routes
app.use("/api/stripe", stripeRoutes);
app.use('/api/childtaskdash/login',childAuth)
app.use('/api/childtaskdash',childtaskdash)
///tasks/:taskId/comment
///tasks/:taskId/complete
// Start the server

const printChildCredentials = async () => {
    try {
      // Fetch all child documents from the database
      const children = await Child.find({}, '_id email password parentUsername'); // Select only the required fields including _id
  
      // Print each child's credentials
      children.forEach((child) => {
        console.log('Child ID:', child._id); // Print the _id
        console.log('Child Username (Email):', child.email);
        console.log('Password:', child.password);
        console.log('Parent Username:', child.parentUsername);
        console.log('----------------------------');
      });
    } catch (error) {
      console.error('Error fetching child credentials:', error.message);
    }
  };
  
  printChildCredentials();

//
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
