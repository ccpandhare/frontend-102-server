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

exports.get = (req, res) => {
    loggedIn(req.cookies).then(user => {
        if(!user) res.status(403).json({"permission denied": "You are not authorised to access this information"});
        else {
            if( (req.params.set>user.set) || (req.params.set==user.set&&req.params.part>user.part) )
                res.status(403).json({"permission denied": "You can't view this part now."});
            else {
                req.params.set = parseInt(req.params.set);
                req.params.part = parseInt(req.params.part);
                let questions = JSON.parse(JSON.stringify(tasks[req.params.set].parts));
                let url = 'http://pandhare.co.in/frontend-102/api/task/'+req.params.set+"/"+req.params.part;
                let cat = questions[req.params.part - 1].category;
                if(cat != "question")
                    res.redirect(url.toLowerCase().replace('question','task'));
                else {
                    if(req.params.set==user.set && req.params.part==user.part)
                        delete questions[req.params.part - 1].answer;
                    res.json(questions[req.params.part - 1]);
                }
            }
        }
    });
}

exports.submit = (req, res) => {
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
                var question = tasks[user.set].parts[user.part - 1];
                if(!question.hasOwnProperty("answer") || question.category != "question")
                    res.status(404).send("Question not found");
                var answer = req.body.answer;
                if (answer.length != question.answer.length)
                    res.json({
                        "status": 1,
                        "next": [user.set, user.part]
                    });
                else {
                    var correct = 1;
                    for(var i = 0; i < answer.length; i++)
                        if(answer[i] !== question.answer[i])
                            correct = 0;
                    next(correct, user).then(value => {
                        res.json({
                            "status": (1 - correct),
                            "next": value
                        });
                    });
                }
            }
        }
    });
}