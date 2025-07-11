const { RateLimiterMongo } = require('rate-limiter-flexible');
const mongoose = require('mongoose');
const config = require('../config/config');

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

const authLimiter = async (req, res, next) => {
  const ipAddr = req.connection.remoteAddress;
  const emailIpKey = `${req.body.email}_${ipAddr}`;
  const [slowerBruteRes, emailIpRes, emailBruteRes] = await Promise.all([
    slowerBruteLimiter.get(ipAddr),
    emailIpBruteLimiter.get(emailIpKey),
    emailBruteLimiter.get(req.body.email),
  ]);
  let retrySeconds = 0;
  if (slowerBruteRes &&
    slowerBruteRes.consumedPoints >= config.rateLimiter.maxAttemptsPerDay
  ) {
    retrySeconds = Math.floor(slowerBruteRes.msBeforeNext / 1000) || 1;
  } else if (emailIpRes &&
    emailIpRes.consumedPoints >= config.rateLimiter.maxAttemptsByIpUsername
  ) {
    retrySeconds = Math.floor(emailIpRes.msBeforeNext / 1000) || 1;
  } else if (emailBruteRes &&
    emailBruteRes.consumedPoints > config.rateLimiter.maxAttemptsPerEmail
  ) {
    retrySeconds = Math.floor(emailBruteRes.msBeforeNext / 1000) || 1;
  }

  if (retrySeconds > 0) {
    return res.status(429).json({
      message: `Too many requests. Retry after ${retrySeconds} seconds.`,
    });
  }

  next();
};

module.exports = {
  emailIpBruteLimiter,
  slowerBruteLimiter,
  authLimiter,
};
