import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PhotoSchema = new Schema({
    cat: {
      type: Schema.Types.ObjectId,
      ref: "Cat"
    },
    url: String,
    description: String
  });

const PhotoModel = mongoose.model("Photo", PhotoSchema);

export default PhotoModel;
