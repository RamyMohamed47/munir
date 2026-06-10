import Message from './../models/messageModel.js';
import { createOne, deleteOne, getAll, updateOne } from './handlerFactory.js';
import catchAsync from './../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from './../utils/apiFeatures.js';

export const getScheduledMessage = catchAsync(async (req, res, next) => {
  const { SMI } = req.body || {};

  if (!Array.isArray(SMI)) {
    return next(new AppError('SMI must be provided as an array', 400));
  }

  if (!SMI.every(index => Number.isFinite(index))) {
    return next(new AppError('SMI must contain only numeric values', 400));
  }

  const filter = {
    state: 'Approved',
    shownMessageIndex: { $nin: SMI },
  };

  const eligibleCount = await Message.countDocuments(filter);

  if (!eligibleCount) {
    return next(new AppError('No scheduled message available', 404));
  }

  const randomIndex = Math.floor(Math.random() * eligibleCount);
  const scheduledMessage = await Message.findOne(filter)
    .skip(randomIndex)
    .populate('user', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      data: scheduledMessage,
    },
  });
});

export const setCurrentUserAsMessageUser = (req, res, next) => {
  req.body.user = req.user._id;
  next();
};

export const getAllMessages = getAll(Message);

export const createMessage = createOne(Message);

export const updateMessage = updateOne(Message);

export const deleteMessage = deleteOne(Message);

export const getMessagesByUserId = catchAsync(async (req, res) => {
  const features = new APIFeatures(
    Message.find({ user: req.params.id }).populate('user', 'name'),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const messages = await features.query;

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      data: messages,
    },
  });
});

