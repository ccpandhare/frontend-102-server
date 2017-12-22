'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var UserSchema = new Schema({
    github_username: {
        type: String,
        default: "",
        unique: true
    },
    github_token: {
        type: String,
        default: ""
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