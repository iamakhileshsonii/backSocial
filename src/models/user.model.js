import mongoose, { mongo } from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: string,
    lowercase: true,
    required: [true, "Username is required"],
    trim: true,
    index: true,
  },
  email: {
    type: string,
    required: [true, "Email is required"],
  },
  fullName: {
    type: string,
    required: [true, "Fullname is required"],
  },
  avatar: {
    type: string,
  },
  coverImage: {
    type: string,
  },
  password: {
    type: string,
    required: [true, "Password is required"],
  },
});

const User = mongoose.model("User", userSchema);
