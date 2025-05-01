const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const toJson = require('@meanie/mongoose-to-json');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      private: true,
      minlength: 8,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error(
            'Password should contain at least one uppercase and lowercase letter, number and special character',
          );
        }
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.statics.isEmailTaken = async function isEmailTaken(email) {
  const user = await this.findOne({ email });
  return !!user;
};
userSchema.pre('save', async function hashPasswordBeforeSave(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.methods.isPasswordMatch = async function isPasswordMatch(password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.plugin(toJson);

const User = mongoose.model('User', userSchema);

module.exports = User;
