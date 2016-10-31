import config from '../config'
import { createClient as redis } from 'redis'
import adapter from 'socket.io-redis'
import Room from '../models/room'

let ioEvents = (io) => {

    io.of('/rooms').on('connection', (socket) => {

        // Create a new room
        socket.on('createRoom', (title) => {
            Room.findOne({ 'title': new RegExp('^' + title + '$', 'i') }, (err, room) => {
                if (err) throw err;
                if (room) {
                    socket.emit('updateRoomsList', { error: 'Room title already exists.' });
                } else {
                    Room.create({
                        title: title
                    }, (err, newRoom) => {
                        if (err) throw err;
                        socket.emit('updateRoomsList', newRoom);
                        socket.broadcast.emit('updateRoomsList', newRoom);
                    });
                }
            });
        });
    });

    io.of('/chatroom').on('connection', (socket) => {

        socket.on('join', (roomId) => {
            Room.findById(roomId, (err, room) => {
                if (err) throw err;
                if (!room) {
                    socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
                } else {
                    if (socket.request.session.passport == null) {
                        return;
                    }

                    Room.addUser(room, socket, (err, newRoom) => {

                        socket.join(newRoom.id);

                        Room.getUsers(newRoom, socket, (err, users, cuntUserInRoom) => {
                            if (err) throw err;

                            socket.emit('updateUsersList', users, true);

                            if (cuntUserInRoom === 1) {
                                socket.broadcast.to(newRoom.id).emit('updateUsersList', users[users.length - 1]);
                            }
                        });
                    });
                }
            });
        });

        socket.on('disconnect', function() {

            if (socket.request.session.passport == null) {
                return;
            }

            Room.removeUser(socket, (err, room, userId, cuntUserInRoom) => {
                if (err) throw err;

                socket.leave(room.id);

                if (cuntUserInRoom === 1) {
                    socket.broadcast.to(room.id).emit('removeUser', userId);
                }
            });
        });

        socket.on('newMessage', (roomId, message) => {

            socket.broadcast.to(roomId).emit('addMessage', message);
        });

    });
}


let init = (app) => {

    let server = require('http').Server(app);
    let io = require('socket.io')(server);
 
    io.set('transports', ['websocket']);
 
    let port = config.redis.port;
    let host = config.redis.host;
    let password = config.redis.password;
    let pubClient = redis(port, host, { auth_pass: password });
    let subClient = redis(port, host, { auth_pass: password, return_buffers: true, });
    io.adapter(adapter({ pubClient, subClient }));
 
    io.use((socket, next) => {
        require('../session')(socket.request, {}, next);
    });
 
    ioEvents(io);
 
    return server;
}

module.exports = init;