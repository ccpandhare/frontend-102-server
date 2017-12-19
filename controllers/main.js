'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('Users');

function loggedIn(cookie) {
    return (cookie.session_id != "");
}

exports.info = (req, res) => {
    var o = {};
    if(req.params.sessionId!=0) o.active_session = req.params.sessionId;
    User.find(o, (err, user) => {
        if(err) res.send(err);
        else res.json(user);
    });
}

exports.login = (req, res) => {
    if(loggedIn(req.cookies)) {
        res.status(403).json({status: 1, error: "Already Logged in"});
        return;
    }
    var body = req.body;
    var now = new Date();
    var session_id = require('crypto').createHash('sha256').update(body.github_username+now+"frontend-102-website").digest('hex');
    User.find({github_username: body.github_username}, (err, user) => {
        user = user[0];
        if(user === undefined) {
            res.status(404).json({status: 1, error: "Incorrect User"});
            return;
        }
        if(err) res.send(err);
        else {
            res.cookie('session_id',session_id);
            User.findOneAndUpdate(
                {github_username: body.github_username}, 
                {active_session: session_id}, 
                {},
                (err, u_user) => {
                    if(err) res.send(err);
                    else res.json({status: 0});
                }
            );
        }
    });
}

exports.register = (req, res) => {
    if(loggedIn(req.cookies)) {
        res.status(403).json({status: 1, error: "Already Logged in"});
        return;
    }
    var new_user = new User(req.body);
    new_user.save((err, user) => {
        if(err) res.send(err);
        else res.json(user);
    });
}

exports.empty = (req, res) => {
    User.remove({}, (err, removed) => {
        if(err) res.send(err);
        else res.json(removed);
    });
}

exports.logout = (req, res) => {
    var session_id = req.cookies.session_id;
    if(!loggedIn(req.cookies)) {
        res.status(403).json({status: 1, error: "Not Logged in"});
        return;
    }
    User.findOneAndUpdate(
        {active_session: session_id},
        {active_session: ""},{},
        (err, user) => {
            if(err) res.send(err);
            else {
                res.cookie("session_id","");
                res.json({status: 0});
            }
        }
    );
}