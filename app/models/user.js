let userModel = require('../database').models.user;

let create = (data, callback) => {
    var newUser = new userModel(data);
    newUser.save(callback);
};

let findOne = (data, callback) => {
    userModel.findOne(data, callback);
}

let findById = (id, callback) => {
    userModel.findById(id, callback);
}


/**
 * Find a user, and create one if doesn't exist already.
 * This method is used ONLY to find user accounts registered via Social Authentication.
 *
 */
let findOrCreate = (data, callback) => {
    findOne({ 'socialId': data.id }, (err, user) => {
        if (err) {
            return callback(err);
        }
        if (user) {
            return callback(err, user);
        } else {
            create({
                username: data.displayName,
                socialId: data.id,
                picture: data.photos[0].value || null
            }, (err, newUser) => {
                callback(err, newUser);
            });
        }
    });
}

/**
 * A middleware allows user to get access to pages ONLY if the user is already logged in.
 *
 */
let isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
}

module.exports = {
    create,
    findOne,
    findById,
    findOrCreate,
    isAuthenticated
};