import mongoose, { mongo } from 'mongoose';

const MONGO_URI = "mongodb+srv://neelpriyansh:BUHM0hbEryFmL4Aw@cluster0.mtjrnw1.mongodb.net/";

const mongodb = async() => {
    try {
        await mongoose.connect(MONGO_URI).then(() => console.log("MongoDB Connected"))
        .catch(err => console.log("MongoDB Connection Error:", err));
        console.log("Connection Succcess");
    } catch (error) {
        console.error("Database Failed") 
        process.exit(0);
    }
}
export default mongodb;