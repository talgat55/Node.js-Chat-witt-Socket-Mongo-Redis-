import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import flash from 'connect-flash'
var app = express();
import routes from './app/routes'
import session from './app/session'
import passport from './app/auth'
let ioServer = require('./app/socket')(app);
import logger from './app/logger'

let port = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', routes);

// Middleware to catch 404 errors
app.use((req, res, next) => {
    res.status(404).sendFile(process.cwd() + '/app/views/404.htm');
});

ioServer.listen(port);