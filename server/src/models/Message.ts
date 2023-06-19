import mongoose from "mongoose";

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "PublishUser",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  replied: {
    type: Boolean,
    default: false
  },
  replyContent: {
    type: String
  },
  charityWorker: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

const MessageModel = mongoose.model("Message", MessageSchema);

export default MessageModel;
