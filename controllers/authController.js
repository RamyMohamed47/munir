import User from './../models/userModel';
import catchAsync from './../utils/catchAsync';
import AppError from './../utils/appError';
import logger from './../utils/logger';

export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action', 403),
      );
    }
    next();
  };
}