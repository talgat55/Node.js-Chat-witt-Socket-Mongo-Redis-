import express from 'express';
var router = express.Router();
import passport from 'passport';

import User from '../models/user';
import Room from '../models/room';

router.get('/', (req, res, next) => {
    if (req.isAuthenticated()) {
        res.redirect('/rooms');
    } else {
        res.render('login', {
            success: req.flash('success')[0],
            errors: req.flash('error'),
            showRegisterForm: req.flash('showRegisterForm')[0]
        });
    }
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/rooms',
    failureRedirect: '/',
    failureFlash: true
}));

router.post('/register', (req, res, next) => {

    let credentials = { 'username': req.body.username, 'password': req.body.password };

    if (credentials.username === '' || credentials.password === '') {
        req.flash('error', 'Missing credentials');
        req.flash('showRegisterForm', true);
        res.redirect('/');
    } else {

        User.findOne({ 'username': new RegExp('^' + req.body.username + '$', 'i'), 'socialId': null }, (err, user) => {
            if (err) throw err;
            if (user) {
                req.flash('error', 'Username already exists.');
                req.flash('showRegisterForm', true);
                res.redirect('/');
            } else {
                User.create(credentials, (err, newUser) => {
                    if (err) throw err;
                    req.flash('success', 'Your account has been created. Please log in.');
                    res.redirect('/');
                });
            }
        });
    }
});

router.get('/auth/facebook', passport.authenticate('facebook'));
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/rooms',
    failureRedirect: '/',
    failureFlash: true
}));

router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/rooms',
    failureRedirect: '/',
    failureFlash: true
}));

router.get('/rooms', [User.isAuthenticated, (req, res, next) => {
    Room.find((err, rooms) => {
        if (err) throw err;
        res.render('rooms', { rooms });
    });
}]);

router.get('/chat/:id', [User.isAuthenticated, (req, res, next) => {
    var roomId = req.params.id;
    Room.findById(roomId, (err, room) => {
        if (err) throw err;
        if (!room) {
            return next();
        }
        res.render('chatroom', { user: req.user, room: room });
    });

}]);

router.get('/logout', (req, res, next) => {
    req.logout();

    req.session = null;

    res.redirect('/');
});

module.exports = router;