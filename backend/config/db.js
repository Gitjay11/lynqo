/**
 * db.js — MongoDB Connection
 * Uses Mongoose to connect to MongoDB Atlas.
 * Called once from server.js on startup.
 */

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ does not need useNewUrlParser / useUnifiedTopology
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Exit with failure — server cannot run without a database
    process.exit(1);
  }
};

export default connectDB;
