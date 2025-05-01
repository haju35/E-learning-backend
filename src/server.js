const express = require('express');

const app = express();
const cors = require('cors');
const httpStatus = require('http-status');
const passport = require('passport');
const { xss } = require('express-xss-sanitizer');
const helmet = require('helmet');
const blogRouter = require('./routes/blog.route');
const authRouter = require('./routes/auth.route');
const { cspOptions, env } = require('./config/config');

const { errorHandler, errorConverter } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
// const mongoSanitize = require('express-mongo-sanitize');

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use(express.json());

// security
app.use(xss());
app.use(
  helmet({
    contentSecurityPolicy: cspOptions,
  }),
);

// app.use(mongoSanitize());

// enabling all cors
if (env === 'production') {
  app.use(cors({ origin: 'url' }));
  app.options('*', cors({ origin: 'url' }));
} else {
  app.use(cors());
  app.options('*', cors());
}

app.use(blogRouter);
app.use(authRouter);

// path not found 404
app.use((req, res, next) => {
  // console.log(`${req.method} ${req.originalUrl}`);
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
