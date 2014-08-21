var path = require('path');
var config = require('./config/config');
var logger = require('./config/log')(config);

// load express hbs templates
var app = require('./config/express-hbs');

// load routes
var routes = require('./config/routes').load(app);

// start the server
var server = require('http').Server(app);
logger.log("debug","Starting on port:"+config.get('http:port'));
server.listen(config.get('http:port'));
