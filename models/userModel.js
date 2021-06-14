const mongoose = require('mongoose');
var validator = require('validator');
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
    required: [true, 'user must have password'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'user must confirm password'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'passwords does not match',
    },
  },
});
const User = mongoose.model('User', userSchema);
module.exports = User;
