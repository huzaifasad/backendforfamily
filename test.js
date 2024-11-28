const mongoose = require('mongoose');
const { PredefinedReward } = require('./models/Reward');
const connectDB = require('./config/db'); // Import the config for DB connection

async function seedRewards() {
    try {
        // Connect to MongoDB
        await connectDB();

        const rewards = [
            { title: 'Extra Spielzeit', description: 'Extra play time', pointsRequired: 20 },
            { title: 'Kinobesuch', description: 'Cinema outing', pointsRequired: 50 },
            { title: 'Neues Spielzeug', description: 'New toy', pointsRequired: 100 },
            { title: 'Besuch im Freizeitpark', description: 'Amusement park visit', pointsRequired: 200 },
        ];

        // Insert predefined rewards
        await PredefinedReward.insertMany(rewards);
        console.log('Predefined rewards seeded successfully!');
    } catch (error) {
        console.error(`Error seeding predefined rewards: ${error.message}`);
    } finally {
        mongoose.disconnect();
    }
}

seedRewards();
