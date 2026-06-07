import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [450, 'Message must be 450 characters or less'],
  },
  time: {
    type: Date,
    default: Date.now,
  },
  state: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected'],
    default: 'Pending',
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  likes: {
    type: Number,
    default: 0,
  },
  shownMessageIndex: {
    type: Number,
    required: [true, "A message should have an index"],
    unique: true
  }
});

const Message = model('Message', messageSchema);
export default Message;
