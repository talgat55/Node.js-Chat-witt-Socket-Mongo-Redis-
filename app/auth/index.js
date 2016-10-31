import config from '../config'
import passport from 'passport'
import logger from '../logger'

import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';

let User = require('../models/user');



let init = () => {

    // Serialize and Deserialize user instances to and from the session.
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    // Plug-in Local Strategy
    passport.use(new LocalStrategy(
        (username, password, done) => {
            User.findOne({ username: new RegExp(username, 'i'), socialId: null }, (err, user) => {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    return done(null, false, { message: 'Incorrect username or password.' });
                }

                user.validatePassword(password, (err, isMatch) => {
                    if (err) {
                        return done(err);
                    }
                    if (!isMatch) {
                        return done(null, false, { message: 'Incorrect username or password.' });
                    }
                    return done(null, user);
                });

            });
        }
    ));

    // In case of Facebook, tokenA is the access token, while tokenB is the refersh token.
    // In case of Twitter, tokenA is the token, whilet tokenB is the tokenSecret.
    var verifySocialAccount = (tokenA, tokenB, data, done) => {
        User.findOrCreate(data, (err, user) => {
            if (err) {
                return done(err);
            }
            return done(err, user);
        });
    };

    // Plug-in Facebook & Twitter Strategies
    passport.use(new FacebookStrategy(config.facebook, verifySocialAccount));
    passport.use(new TwitterStrategy(config.twitter, verifySocialAccount));

    return passport;
}

module.exports = init();