import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistrationCode extends Document {
  code: string;
  used: boolean; // 添加used属性
}

const RegistrationCodeSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
});

const RegistrationCodeModel = mongoose.model<IRegistrationCode>('RegistrationCode', RegistrationCodeSchema);

export default RegistrationCodeModel;
