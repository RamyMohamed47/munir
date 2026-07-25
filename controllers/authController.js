import User from './../models/userModel.js';
import catchAsync from './../utils/catchAsync.js';
import AppError from './../utils/appError.js';
import { getFirebaseAuth } from './../utils/firebaseAdmin.js';

const syncFirebaseUser = async ({ user_id, email, name, role}) => {
  if (!user_id || !email ||!name || !role) {
    throw new AppError('Firebase user is missing required data', 400);
  }

  try {
    return await User.findOneAndUpdate(
      { firebaseUid: user_id },
      {  email, firebaseUid: user_id , name, role},
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('A user with this email already exists', 409);
    }

    throw error;
  }
};

export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('You are not logged in. Please provide a valid token', 401),
    );
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(
      new AppError('You are not logged in. Please provide a valid token', 401),
    );
  }

  let decodedToken;

  try {
    decodedToken = await getFirebaseAuth().verifyIdToken(token);
  } catch (error) {
    return next(new AppError('Invalid token, please log in again', 401));
  }

  const { user_id, email, name, role} = decodedToken;

  try {
    const user = await syncFirebaseUser({ user_id, email, name, role });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
});

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
