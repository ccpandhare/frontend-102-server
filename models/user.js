'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var UserSchema = new Schema({
    github_username: {
        type: String,
        default: ""
    },
    github_oauth: {
        type: String,
        default: ""
    },
    points: {
        type: Number,
        default: 0
    },
    set: {
        type: Number,
        default: 1
    },
    part: {
        type: Number,
        default: 1
    },
    active_session: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model('Users',UserSchema);