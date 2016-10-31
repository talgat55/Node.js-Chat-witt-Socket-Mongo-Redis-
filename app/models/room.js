let roomModel = require('../database').models.room;
import User from '../models/user';

let create = (data, callback) => {
    let newRoom = new roomModel(data);
    newRoom.save(callback);
};

let find = (data, callback) => {
    roomModel.find(data, callback);
}

let findOne = (data, callback) => {
    roomModel.findOne(data, callback);
}

let findById = (id, callback) => {
    roomModel.findById(id, callback);
}

let findByIdAndUpdate = (id, data, callback) => {
    roomModel.findByIdAndUpdate(id, data, { new: true }, callback);
}

/**
 * Add a user along with the corresponding socket to the passed room
 *
 */
let addUser = (room, socket, callback) => {

    // Get current user's id
    let userId = socket.request.session.passport.user;

    // Push a new connection object(i.e. {userId + socketId})
    let conn = { userId: userId, socketId: socket.id };
    room.connections.push(conn);
    room.save(callback);
}

/**
 * Get all users in a room
 *
 */
let getUsers = (room, socket, callback) => {

    let users = [],
        vis = {},
        cunt = 0;
    let userId = socket.request.session.passport.user;

    // Loop on room's connections, Then:
    room.connections.forEach((conn) => {

        // 1. Count the number of connections of the current user(using one or more sockets) to the passed room.
        if (conn.userId === userId) {
            cunt++;
        }

        // 2. Create an array(i.e. users) contains unique users' ids
        if (!vis[conn.userId]) {
            users.push(conn.userId);
        }
        vis[conn.userId] = true;
    });

    // Loop on each user id, Then:
    // Get the user object by id, and assign it to users array.
    // So, users array will hold users' objects instead of ids.
    users.forEach((userId, i) => {
        User.findById(userId, (err, user) => {
            if (err) {
                return callback(err);
            }
            users[i] = user;
            if (i + 1 === users.length) {
                return callback(null, users, cunt);
            }
        });
    });
}

/**
 * Remove a user along with the corresponding socket from a room
 *
 */
let removeUser = (socket, callback) => {

    // Get current user's id
    let userId = socket.request.session.passport.user;

    find((err, rooms) => {
        if (err) {
            return callback(err);
        }

        // Loop on each room, Then:
        rooms.every((room) => {
            let pass = true,
                cunt = 0,
                target = 0;

            // For every room, 
            // 1. Count the number of connections of the current user(using one or more sockets).
            room.connections.forEach((conn, i) => {
                if (conn.userId === userId) {
                    cunt++;
                }
                if (conn.socketId === socket.id) {
                    pass = false, target = i;
                }
            });

            // 2. Check if the current room has the disconnected socket, 
            // If so, then, remove the current connection object, and terminate the loop.
            if (!pass) {
                room.connections.id(room.connections[target]._id).remove();
                room.save((err) => {
                    callback(err, room, userId, cunt);
                });
            }

            return pass;
        });
    });
}

module.exports = {
    create,
    find,
    findOne,
    findById,
    addUser,
    getUsers,
    removeUser
};