const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/userModel');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      const name = profile.displayName;
      const FirstName = profile.name.givenName;
      const LastName = profile.name.familyName;
      const googleId = profile.id;
      const photo = profile.photos[0].value;
      const email = profile.emails[0].value;
      const password = accessToken;
      const passwordConfirm = accessToken;
      const newUser = {
        googleId,
        email,
        name,
        FirstName,
        LastName,
        password,
        passwordConfirm,
        photo,
      };
      let user;
      user = await User.findOne({ googleId: googleId });
      if (!user) {
        user = await User.create(newUser);
      }
      done(null, user);
    }
  )
);
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK,
      profileFields: ['email', 'name'],
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      const name = profile.displayName;
      const FirstName = profile.name.givenName;
      const LastName = profile.name.familyName;
      const facebookId = profile.id;
      const photo = profile.photos[0].value;
      const email = profile.emails[0].value;
      const password = accessToken;
      const passwordConfirm = accessToken;
      const newUser = {
        facebookId,
        email,
        name,
        FirstName,
        LastName,
        password,
        passwordConfirm,
        photo,
      };
      let user;
      user = await User.findOne({ facebookId: facebookId });
      if (!user) {
        user = await User.create(newUser);
      }
      done(null, user);
    }
  )
);
