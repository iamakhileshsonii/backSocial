const { default: mongoose } = require("mongoose");

const likeSchema = new mongoose.Schema({
    video: {
        type: mongoose.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: mongoose.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: mongoose.Types.ObjectId,
        ref: "Tweet"
    }
}, { timestamps: true })

export const Like = mongoose.model("Like", likeSchema)