import Message from './../models/messageModel.js';
import catchAsync from './../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getMessages = catchAsync(async (req, res, next) => {
  const { SMI } = req.body || {};

  if (!Array.isArray(SMI)) {
    return next(new AppError('SMI must be provided as an array', 400));
  }

  if (!SMI.every(index => Number.isFinite(index))) {
    return next(new AppError('SMI must contain only numeric values', 400));
  }

  const messages = await Message.find({
    shownMessageIndex: { $in: SMI },
  }).populate('user', 'name');

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      data: messages,
    },
  });
});

