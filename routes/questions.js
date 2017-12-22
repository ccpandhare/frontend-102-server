'use strict';
module.exports = function(app) {
    var Question = require('../controllers/questions');
    var Task = require('../controllers/tasks');
    app.route('/frontend-102/question/:set/:part')
        .get(Question.get)
        .post(Question.submit);
    app.route('/frontend-102/task/:set/:part')
        .get(Task.get)
        .post(Task.validate);
}