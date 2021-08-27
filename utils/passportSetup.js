const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(
  new GoogleStrategy(
    {
      clientID:
        '714452005953-qncn8a23o4k14h8te5jrvnum4mqdsukm.apps.googleusercontent.com',
      clientSecret: 'UySdjmtsiPFgbvEATO_3WsV4',
      callbackURL: 'http://localhost:3002/api/v1/users/google/redirect',
      proxy: true,
    },
    (accessToken, refreshToken, profile, done) => {
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
      User.findOrCreate(newUser, (err, user) => done(err, user));
    }
  )
);
