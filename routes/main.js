'use strict';
module.exports = function(app) {
    var Main = require('../controllers/main');
    app.route('/frontend-102/session/:sessionId')
        .get(Main.info);
    app.route('/frontend-102/login')
        .post(Main.login);
    app.route('/frontend-102/register')
        .post(Main.register);
    app.route('/frontend-102/logout')
        .get(Main.logout);
    app.route('/frontend-102/empty')
        .get(Main.empty);
}