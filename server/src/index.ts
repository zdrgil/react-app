import express,{Request,Response} from "express";
import mongoose from 'mongoose';
import Deckmodel from "./models/Deck";

const PORT = 5500;
const app = express()

app.use(express.json());



app.post('/decks',async(req:Request,res:Response) => {
    console.log(req.body)
    const newDeck = new Deckmodel({
        title: req.body.title,

         });
       const createduck = await newDeck.save()
       res.json(createduck)
});

mongoose.connect(
    'mongodb+srv://zdrg:kxbJBs7NnYcI1iUC@cluster0.davcscf.mongodb.net/?retryWrites=true&w=majority'
    )
    .then(() => {
        console.log(`listening on port ${PORT}`);
        app.listen(PORT);
    })


