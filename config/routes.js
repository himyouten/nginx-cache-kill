var site = require('../routes/site');
var error = require('../routes/error');
module.exports.load = function(app){
    // login
    // app.get('/login', login.show);
    // app.post('/login', login.process);
    // app.get('/login/fail', login.fail);

    // homepage
    app.all('/', site.homepage);

    app.all('/api/kill', cachekill.kill);
    app.all('/api/list', cachekill.kill);

    app.use(error.notFound);
    
    app.use(error.logErrors);
    app.use(error.clientErrorHandler);
    app.use(error.errorHandler);
}