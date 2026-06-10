import { getOne, updateOne, deleteOne, getAll } from './handlerFactory.js';
import Message from './../models/messageModel.js';
import User from './../models/userModel.js';
import catchAsync from './../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getUserById = getOne(User);

export const updateUser = updateOne(User);

export const deleteUser = deleteOne(User);

export const getAllUsers = getAll(User);

export const getMe = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('No authenticated user found', 401));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: req.user,
    },
  });
});

export const authorizeUserMessagesAccess = (req, res, next) => {
  if (
    req.user.role === 'admin' ||
    req.user._id.toString() === req.params.id
  ) {
    return next();
  }

  return next(
    new AppError('You are not authorized to access these messages', 403),
  );
};

export const getStatistics = catchAsync(async (req, res) => {
  const [userCount, messageCount, totalLikesResult, stateCounts] =
    await Promise.all([
      User.countDocuments(),
      Message.countDocuments(),
      Message.aggregate([
        {
          $group: {
            _id: null,
            totalLikes: { $sum: '$likes' },
          },
        },
      ]),
      Message.aggregate([
        {
          $group: {
            _id: '$state',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const messagesByState = {
    Approved: 0,
    Pending: 0,
    Rejected: 0,
  };

  stateCounts.forEach(({ _id, count }) => {
    messagesByState[_id] = count;
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: {
        totalUsers: userCount,
        totalMessages: messageCount,
        messagesByState,
        totalLikes: totalLikesResult[0]?.totalLikes || 0,
      },
    },
  });
});
