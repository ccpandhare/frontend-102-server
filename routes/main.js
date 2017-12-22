'use strict';
module.exports = function(app) {
    var Main = require('../controllers/main');
    app.route('/frontend-102/info')
        .get(Main.info);
    app.route('/frontend-102/login')
        .get(Main.login);
    app.route('/frontend-102/logout')
        .get(Main.logout);
    // app.route('/frontend-102/empty')
    //     .get(Main.empty);
    // app.route('/frontend-102/setpart/:set/:part')
    //     .get(Main.set);
    app.route('/frontend-102/next/:set/:part')
        .get(Main.next);
}