var site = require('../routes/site');
var error = require('../routes/error');
var cachekill = require('../routes/cachekill');
var express = require('express');

module.exports.load = function(app){
    // login
    // app.get('/login', login.show);
    // app.post('/login', login.process);
    // app.get('/login/fail', login.fail);

    // homepage
    app.all('/', site.homepage);

    app.get('/api/kill', cachekill.killUrl)
    app.post('/api/kill', cachekill.killUrls);

    app.use(error.notFound);
    
    app.use(error.logErrors);
    app.use(error.clientErrorHandler);
    app.use(error.errorHandler);
}