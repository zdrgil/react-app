import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId

const User = new Schema({
    id: ObjectId,
    username: String,
    password: String,
    usedRegistrationCodes: [String], // 保存已使用的注册代码
});



const Usermodel = mongoose.model("User", User)

export default Usermodel;