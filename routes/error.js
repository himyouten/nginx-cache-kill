var logger = require('winston');

exports.notFound = function(req, res, next){
  res.send(404, 'Sorry cant find that!');
}

exports.logErrors = function(err, req, res, next) {
  logger.log("error", err.stack);
  next(err);
}

exports.clientErrorHandler = function(err, req, res, next) {
    if (req.xhr) {
      logger.log("error", "sending xhr error");
      res.send(500, { error: 'oops!' });
    } else {
      next(err);
    }
}

exports.errorHandler = function(err, req, res, next) {
    res.status(500);
    res.render('error', { title: "Error", error: err });
}