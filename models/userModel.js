const mongoose = require('mongoose');
var validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
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
  },
  password: {
    type: String,
    required: [true, 'user must have a password'],
    minlength: 8,
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
});

//using document middleware on save to encrypt the password
userSchema.pre('save', async function (next) {
  //only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //12 is cost parameter,how cpu intensive this operation will be, more mean more complicated and more time to encrypt
  this.password = await bcrypt.hash(this.password, 12);

  //delete the passwordConfirm to not save in the database
  this.passwordConfirm = undefined;
});
const User = mongoose.model('User', userSchema);
module.exports = User;
