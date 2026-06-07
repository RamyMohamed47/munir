import { getOne, updateOne, deleteOne, getAll } from './handlerFactory';
import User from './../models/userModel';
import catchAsync from './../utils/catchAsync';
import AppError from '../utils/appError';

export const getUserById = getOne(User);

export const updateUser = updateOne(User);

export const deleteUser = deleteOne(User);

export const getAllUsers = getAll(User);
