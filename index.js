'use strict';
var express = require('express'),
    app = express(),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    port = process.env.PORT || 3000,
    pck = require('./package.json'),
    Users = require('./models/user');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/frontend-102-db/');

app.use(express.static('www'));
app.use(cookieParser());
app.use(bodyParser.json());

var routes = require('./routes/main');
var questions = require('./routes/questions');
routes(app);
questions(app);

app.listen(port);

console.log("frontend-102 v"+pck.version+" running on 127.0.0.1:"+port);