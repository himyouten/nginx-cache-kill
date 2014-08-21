var logger = require('winston');

exports.homepage = function(req, res){
    logger.log("info","homepage rendered");
    res.render('index', {
      title: 'Goaf Nginx Invalidator',
      lead: 'Invalidate Nginx cache items'
    });
}