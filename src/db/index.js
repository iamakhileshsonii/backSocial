import mongoose from "mongoose";
import { DB_NAME } from "../utils/constants.js";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      `mongodb+srv://thisisakhileshsoni:Admin123@cluster0.ublviib.mongodb.net`
    );
    console.log("DATABASE CONNECTED !!!!");
  } catch (error) {
    console.log("ERROR CONNECTING DATABASE!!!", error);
  }
};

// mongoose.connect("mongodb://127.0.0.1:27017/test");

export { connectDB };
