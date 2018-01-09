'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('Users');

var parts = require('../tasks/all');

var client_id = require("../gh_app/credentials.json").client_id;
var client_secret = require("../gh_app/credentials.json").client_secret;

function loggedIn(cookie) {
    return (!(cookie.session_id === "" || cookie.session_id === undefined));
}

function gh_login(code) {
    return new Promise((resolve, reject) => {
        require('request').post({
            uri: "https://github.com/login/oauth/access_token",
            json: true,
            body: {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "accept": "json"
            }
        }, (err, res2, body) => {
            resolve(body.access_token);
        });
    });
}

function gh_user(token) {
    console.log(token);
    return new Promise((resolve, reject) => {
        require('request').post({
            uri: "https://api.github.com/user",
            json: true,
            body: {},
            auth: {
                bearer: token
            },
            headers: {
                'User-Agent': "FE102 Login"
            }
        }, (err, res2, body) => {
            console.log(res2);
            if(body.hasOwnProperty("login")) resolve(body);
            else reject(res2);
        });
    });
}

exports.next = (req, res) => {
    var set = parseInt(req.params.set);
    var part = parseInt(req.params.part);
    var next;
    if(parts[set].parts.length > part) {
        next = [set, part+1];
    }
    else if(parts[set].parts.length == part) {
        if(parts.hasOwnProperty(parseInt(set)+1))
            next = [set+1, 1];
        else next = [null, null];
    }
    else next = [null, null]
    res.status(200).json({
        "next": next,
    });
}

exports.info = (req, res) => {
    var o = {};
    o.active_session = req.cookies.session_id;
    if(req.cookies.session_id === "" || req.cookies.session_id === undefined) {
        res.json({
            status: 1,
            error: "Not logged in"
        });
        return;
    }
    // if(o.active_session == 0) {
    //     User.find({}, (err,user) => {
    //         res.json(user);
    //     });
    //     return;
    // }
    User.find(o, (err, user) => {
        if(err) res.send(err);
        else if(user.length>0) res.json({
            username: user[0].github_username,
            set: user[0].set,
            part: user[0].part
            // active_session: user[0].active_session
            // token: user[0].github_token
        });
        else res.status(404).json({
            status: 1,
            error: "User not found"
        });
    });
}

exports.login = (req, res) => {
    console.log("OKA");
    if(loggedIn(req.cookies)) {
        res.status(403).json({status: 1, error: "Already Logged in"});
        return;
    }
    var body = req.body;
    var now = new Date();
    var gh_code = req.query.code;

    gh_login(gh_code).then(token => {
        gh_user(token).then(gh_user => {

            var session_id = require('crypto').createHash('sha256').update(gh_user.login+now+"frontend-102-website").digest('hex');

            User.find({github_username: gh_user.login}, (err, user) => {
                if(err) res.status(500).send(err);
                user = user[0];
                new Promise((resolve, reject) => {
                    if(user === undefined) {
                        user = new User({
                            github_username: gh_user.login,
                            name: gh_user.login,
                            github_token: token
                        });
                        user.save((err, user) => {
                            if(err) res.status(500).send(err);
                            console.log("err", user, err);
                            resolve();
                        });
                    }
                    else resolve();
                }).then( () => {
                    res.cookie('session_id',session_id);
                    User.findOneAndUpdate(
                        {github_username: gh_user.login}, 
                        {active_session: session_id}, 
                        {},
                        (err, u_user) => {
                            if(err) res.send(err);
                            else res.json({status: 0});
                        }
                    );
                });
            });
        }).catch(err => res.status(500).send({status: 1, error: "Invalid Temp Code", details: err}));
    }).catch(err => res.status(500).send({status: 1, error: "GitHub Auth Cancelled"}));

}

exports.empty = (req, res) => {
    User.remove({}, (err, removed) => {
        if(err) res.send(err);
        else res.json(removed);
    });
}

exports.set = (req, res) => {
    var session_id = req.cookies.session_id;
    User.findOneAndUpdate(
        {active_session: session_id},
        {set: req.params.set, part: req.params.part},{},
        (err, user) => {
            if(err) res.send(err);
            else {
                res.json({status: 0});
            }
        }
    );
}

exports.logout = (req, res) => {
    var session_id = req.cookies.session_id;
    if(!loggedIn(req.cookies)) {
        res.cookie("session_id","");
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

exports.parts = (req, res) => {
    let list = parts[req.params.set].parts.map(x=>{
        return {
            name: x.name,
            title: x.title
        }
    });
    res.json(list);
}