const httpStatus = require('http-status');
const { RateLimiterMongo } = require('rate-limiter-flexible');
const mongoose = require('mongoose');
const userService = require('./user.service');
const tokenService = require('./token.service');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const config = require('../config/config');

const login = async (email, password, ipAddr) => {
  const rateLimiterOptions = {
    storeClient: mongoose.connection,
    dbName: 'blog_app',
    blockDuration: 60 * 60 * 24,
  };

  const emailIpBruteLimiter = new RateLimiterMongo({
    ...rateLimiterOptions,
    points: config.rateLimiter.maxAttemptsByIpUsername,
    duration: 60 * 10,
  });

  const slowerBruteLimiter = new RateLimiterMongo({
    ...rateLimiterOptions,
    points: config.rateLimiter.maxAttemptsPerDay,
    duration: 60 * 60 * 24,
  });

  const emailBruteLimiter = new RateLimiterMongo({
    ...rateLimiterOptions,
    points: config.rateLimiter.maxAttemptsPerEmail,
    duration: 60 * 60 * 24,
  });

  const promises = [slowerBruteLimiter.consume(ipAddr)];
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    if (user) {
      promises.push([
        emailIpBruteLimiter.consume(`${email}_${ipAddr}`),
        emailBruteLimiter.consume(email),
      ]);
    }

    await promises.all(promises);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

const refreshAuthToken = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH,
    );
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user.id);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

module.exports = {
  login,
  refreshAuthToken,
};
