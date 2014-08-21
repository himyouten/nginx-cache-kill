var logger = require('winston');
var path = require('path');
var express = require('express');
var app = express();
var hbs = require('express-hbs');
var rootdir = require('path').dirname(require.main.filename);
logger.log('info',"main filename:%s", require.main.filename);
// set up static
app.use("/public", express.static(rootdir + '/public'));

// Hook in express-hbs and tell it where known directories reside
var viewsDir = rootdir + '/views';
app.engine('hbs', hbs.express3({
    partialsDir: [rootdir + '/views/partials'],
    defaultLayout: rootdir + '/views/layout/default.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', viewsDir);

module.exports = app;