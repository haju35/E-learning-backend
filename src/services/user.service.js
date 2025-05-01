const httpStatus = require('http-status');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

const createUser = async (userBody) => {
  // check if email exists
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already taken');
  }
  const user = await User.create(userBody);
  return user;
};
const getUserByEmail = async (email) => User.findOne({ email });

const getUserById = async (id) => User.findById({ id });

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};
