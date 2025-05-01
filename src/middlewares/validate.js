const joi = require('joi');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const keys = Object.keys(schema);
  const object = keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(req, key)) {
      return { ...acc, [key]: req[key] };
    }
    return acc;
  }, {});

  const { value, error } = joi.compile(schema).validate(object);
  if (error) {
    const errors = error.details.map((detail) => detail.message).join(',');
    next(new ApiError(400, errors));
  }
  keys.forEach((key) => {
    if (value[key]) {
      Object.assign(req[key], value[key]);
    }
  });
  return next();
};

module.exports = validate;
