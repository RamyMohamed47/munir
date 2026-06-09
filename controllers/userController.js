import { getOne, updateOne, deleteOne, getAll } from './handlerFactory.js';
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
