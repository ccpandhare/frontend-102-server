'use strict';
module.exports = function(app) {
    var Question = require('../controllers/questions');
    app.route('/frontend-102/task/:set/:part')
        .get(Question.get)
        .post(Question.submit);
}