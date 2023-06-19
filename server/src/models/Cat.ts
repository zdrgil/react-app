import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CatSchema = new Schema({
    name: String,
    age: Number,
    breed: String,
    photos: [
        {
          url: String,
          description: String
        }
      ]
  });

const CatModel = mongoose.model("Cat", CatSchema);

export default CatModel;
