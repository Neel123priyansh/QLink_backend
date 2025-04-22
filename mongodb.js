import mongoose, { mongo } from 'mongoose';

const URI = "mongodb://localhost:27017/dbmserver"  

const mongodb = async() => {
    try {
        await mongoose.connect(URI)
        console.log("Connection Succcess");
    } catch (error) {
        console.error("Database Failed") 
        process.exit(0);
    }
}
export default mongodb;