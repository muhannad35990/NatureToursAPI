const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
  },
  facebookId: {
    type: String,
  },
  FirstName: {
    type: String,

    required: [true, 'A user must have a first name'],
  },

  LastName: {
    type: String,
    required: [true, 'A user must have last name'],
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    required: [true, ' user must have an email'],
    unique: true,
    lowecase: true,
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'user must have a password'],
    minlength: 8,
    select: false, //never show the passowrd in the response
  },
  passwordConfirm: {
    type: String,
    required: [true, 'user must confirm the password'],
    validate: {
      //this only woks on save and create and not with findandupdate
      validator: function (val) {
        return val === this.password;
      },
      message: 'passwords does not match',
    },
  },
  refreshToken: { type: String, select: false },
  passwordChangedAt: { type: Date, default: new Date(), select: false },
  passwordRestToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//using document middleware on save to encrypt the password
userSchema.pre('save', async function (next) {
  //only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //12 is cost parameter,how cpu intensive this operation will be, more mean more complicated and more time to encrypt
  this.password = await bcrypt.hash(this.password, 12);

  //delete the passwordConfirm to not save in the database
  this.passwordConfirm = undefined;
  next();
});
//update changedPasswordAt property for the user after reseting the password
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //coz issing the token sometimes get faster than changing the date so to insure that the date is after issing the token we subtract 1s
  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to current query so we return only active:true
  this.find({ active: { $ne: false } });

  next();
});
userSchema.pre(/^findOneAnd/, async function (next) {
  //Encrypt refresh Token
  if (this._update.refreshToken)
    this._update.refreshToken = await bcrypt.hash(
      this._update.refreshToken,
      12
    );
  next();
});

//instance method to check if the password is correct
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

//instance method to check if the refresh token is correct
userSchema.methods.correctRefreshToken = async function (
  candidateRefreshToken,
  userRefreshToken
) {
  return bcrypt.compare(candidateRefreshToken, userRefreshToken);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return changedTimestamp > JWTTimestamp; //check if password changed after issue the jwt
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordRestToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //after 10 min
  return resetToken; //send non encrypted token to th email
};

const User = mongoose.model('User', userSchema);
module.exports = User;
