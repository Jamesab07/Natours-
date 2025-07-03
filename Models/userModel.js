const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

//const { validate } = require('./tourModel');
//const { Schema } = require('./tourModel');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please input your name"],
    trim: true,
    // unique: true,
    // minlength: [10, 'name must not be below 10 characters'],
    // maxlength: [30, 'name must not be above 30 characters'],
  },
  email: {
    type: String,
    required: [true, "please input your email address"],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "please provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["admin", "guide", "lead-guide", "user"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "please input your password"],
    trim: true,
    minlenght: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "please confirm your password"],
    trim: true,
    minlenght: 8,
    validate: {
      //this works only on SAVE and CREATE
      validator: function (el) {
        return el === this.password;
      },
      message: "passwords are not the same",
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  //only run this function if password was modified
  if (!this.isModified("password")) return next();

  //hash password with 12 cost
  this.password = await bcrypt.hash(this.password, 12);

  //delete or hiding password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//instance methods
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  //false means not changed
  return false;
};
userSchema.method("createPasswordResetToken", function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
});

const User = mongoose.model("User", userSchema);
module.exports = User;
