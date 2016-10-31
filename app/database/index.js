import config from '../config'
import Mongoose from 'mongoose'
import logger from '../logger'

Mongoose.connect(config.dbURI);

Mongoose.connection.on('error', (err) => {
    if (err) throw err;
});

Mongoose.Promise = global.Promise;

module.exports = {
    Mongoose,
    models: {
        user: require('./schemas/user.js'),
        room: require('./schemas/room.js')
    }
};