var winston = require('winston');
function logger(nconf){
    winston.remove(winston.transports.Console).add(winston.transports.Console, { level: nconf.get('logging:console:level') });
    if (nconf.get("logging:file:filename") != undefined && nconf.get("logging:file:filename").length > 0){
        winston.log("debug","setting up log file:"+nconf.get("logging:file:filename"));
        winston.add(winston.transports.File, {'filename': nconf.get("logging:file:filename"), 'level': nconf.get("logging:file:level"), 'json': false});
    }
    return winston;
}
module.exports=logger;