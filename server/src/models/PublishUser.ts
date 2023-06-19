import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PublishUserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  favoriteCats: [
    {
      type: Schema.Types.ObjectId,
      ref: "Cat"
    }
  ],
  externalAuth: {
    provider: String,
    providerId: String
  }
});

const PublishUserModel = mongoose.model("PublishUser", PublishUserSchema);

export default PublishUserModel;
