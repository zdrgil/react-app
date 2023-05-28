import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId

const Deck = new Schema({
  author: ObjectId,
  title: String,
  body: String,
  date: Date
});



const Deckmodel = mongoose.model("Deck",Deck)

export default Deckmodel;