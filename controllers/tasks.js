'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('Users');

var tasks = require("../tasks/all");

function loggedIn(cookie) {
    return new Promise(resolve => {
        cookie.session_id = cookie.session_id || "";
        if(cookie.session_id == "") resolve(false);
        else {
            User.find({active_session: cookie.session_id}, (err, user) => {
                if(!err) resolve(user[0]);
                else resolve(false);
            });
        }
    });
}

function getCode(file,user) {
    return new Promise((resolve, reject) => {
        let uri = "https://api.github.com/repos/"+user.github_username+"/frontend-102/contents/"+file;
        require('request').get({
            uri: uri,
            json: true,
            body: {},
            auth: {
                bearer: user.github_token
            },
            headers: {
                'User-Agent': "FE102 Login"
            }
        }, (err, res2, body) => {
            if(body.hasOwnProperty("content")) resolve(require('base-64').decode(body.content));
            else reject();
        });
    });
}

exports.get = (req, res) => {
    loggedIn(req.cookies).then(user => {
        if(!user) res.status(403).json({"permission denied": "You are not authorised to access this information"});
        else {
            if( (req.params.set>user.set) || (req.params.set==user.set&&req.params.part>user.part) )
                res.status(403).json({"permission denied": "You can't view this part now."});
            else {
                let questions = JSON.parse(JSON.stringify(tasks[req.params.set].parts));
                let url = 'http://pandhare.co.in/frontend-102/api/question'+req.params.set+"/"+req.params.part;
                if(questions[req.params.part - 1].category != "task")
                    res.redirect(url.toLowerCase().replace('task','question'));
                else {
                    delete questions[req.params.part - 1].test;
                    res.json(questions[req.params.part - 1]);
                }
            }
        }
    });
}

exports.validate = (req, res) => {
    var next = (correct, user) => {
        return new Promise(resolve => {
            let following;
            let current = tasks[user.set];
            if(!correct) resolve([user.set, user.part]);
            else {
                if(current.parts.length === user.part) {
                    if(tasks.hasOwnProperty(user.set+1)) {
                        following = tasks[user.set+1];
                        User.findOneAndUpdate({"_id": user._id}, {set: user.set+1, part: 1}, (err, u) => {
                            if(!err) resolve([user.set+1,1]);
                            else resolve([user.set,user.part]);
                        });
                    }
                    else {
                        resolve(["none","none"]);
                    }
                }
                else {
                    User.findOneAndUpdate({"_id": user._id}, {set: user.set, part: user.part+1}, (err, u) => {
                        if(!err) resolve([user.set,user.part+1]);
                        else resolve([user.set,user.part]);
                    });
                }
            }
        });
    }
    loggedIn(req.cookies).then(user => {
        if(!user) res.status(403).json({"permission denied": "You are not authorised to access this information"});
        else {
            if(req.params.set != user.set || req.params.part != user.part)
                res.status(403).json({"permission denied": "You can't view this question now"});
            else {
                let task = tasks[user.set].parts[user.part - 1];
                if(!task.hasOwnProperty("test") || task.category != "task")
                    res.status(404).send("Task not found");
                let answer = req.body.answer;
                let test = "../"+task.test;
                next(1, user).then(value => {
                    res.json({
                        "status": 0,
                        "next": value
                    });
                });
                // getCode(task.file,user).then(contents => {
                //     require(test)(contents).then(correct => {
                //         next(correct, user).then(value => {
                //             res.json({
                //                 "status": (1 - correct),
                //                 "next": value,
                //                 "contents": contents
                //             });
                //         });
                //     }).catch(err => {
                //         res.json({
                //             "status": 1,
                //             "err": err,
                //             "next": [user.set, user.part]
                //         })
                //     });
                // }).catch(err => {
                //     res.json({
                //         status: 1,
                //         err: err
                //     });
                // });
            }
        }
    });
}