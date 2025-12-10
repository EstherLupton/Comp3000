require('dotenv').config();
const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB');
        } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectToDatabase();