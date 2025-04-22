import mongoose from 'mongoose';

const userschema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  discriptor: [Number] // 128-length float array
});

const dbmschema = mongoose.model("userDBMS", userschema);

export default dbmschema;
