var logger = require('winston');

exports.kill = function(req, res){
    logger.log("info","cachekill kill requested");
}