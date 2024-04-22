import mongoose, { Schema, model } from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    videoFile: { type: string, required: true },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      index: true,
      lowercase: true,
      required: true,
    },
    description: {
      type: String,
      index: true,
      lowercase: true,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const video = mongoose.model("Video", videoSchema);
