const { default: mongoose } = require("mongoose");

const tweetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }
})

export const Tweet = mongoose.model("Tweet", tweetSchema )