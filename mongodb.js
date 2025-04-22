import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://neelpriyansh:BUHM0hbEryFmL4Aw@cluster0.mtjrnw1.mongodb.net/test?retryWrites=true&w=majority";

// Optional: Mongoose connection options
const options = {
  dbName: "test_dbms", // You can change this if needed
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, options);
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1); // Exit the process on failure
  }
};

export default connectDB;
