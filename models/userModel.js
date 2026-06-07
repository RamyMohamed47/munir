import { Schema, model } from 'mongoose';
import { isEmail } from 'validator';

const userSchema = Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valid email'],
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  //   authProviders: {
  //     type: [
  //       {
  //         provider: {
  //           type: String,
  //           enum: ['google', 'github'],
  //           required: true,
  //         },
  //         providerId: {
  //           type: String,
  //           required: true,
  //         },
  //         email: {
  //           type: String,
  //           required: true,
  //           lowercase: true,
  //           validate: [isEmail, 'Please provide a valid email'],
  //         },
  //         linkedAt: {
  //           type: Date,
  //           default: Date.now,
  //         },
  //       },
  //     ],
  //     default: [],
  //   },
});

const User = model('User', userSchema);
export default User;