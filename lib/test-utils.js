var fs = require("fs");
var logger = require('winston');
var redis = require('redis');
var urlRelated = 'http://my.testrelated/purgeTest.htm';

exports.initRedis = function(host, port, done){
    try {
        logger.log('info','test connecting to redis %s:%s', host, port);
        var redisClient = redis.createClient(port, host);
        
        redisClient.on("error", function(err){
            logger.log('error', 'test redis error:'+err)
        });
        redisClient.on("connect", function(){
            logger.log('info', 'test connected to %s:%s', redisClient.host, redisClient.port);
            redisClient.sadd(urlRelated, 'http://my.testrelated/purgeTest.htm?related1');
            redisClient.sadd(urlRelated, 'http://my.testrelated/purgeTest.htm?related2');
            done();
        });

    } catch (err){
        logger.log('warn', 'test cannot connect to redis');
        done();
    }
}

exports.checkRedis = function(host, port, url, urlRelated, cb){
    try {
        logger.log('info','test connecting to redis %s:%s', host, port);
        var redisClient = redis.createClient(port, host);
        
        redisClient.on("error", function(err){
            logger.log('error', 'test redis error:'+err)
        });
        redisClient.on("connect", function(){
            logger.log('info', 'test connected to %s:%s', redisClient.host, redisClient.port);
            // check is member of set, otherwise do the the cb
            redisClient.sismember(url, urlRelated, function(err, reply){
                cb(err, reply);
            });
        });

    } catch (err){
        logger.log('warn', 'test cannot connect to redis');
        cb(err);
    }
}

exports.initTmpDir = function(tmpDir, files){
    try {
        fs.mkdirSync(tmpDir)
    } catch (err){
        if (err.code != 'EEXIST')
            logger.log('warn', 'failed to mkdir tmpDir:%s, %j', tmpDir, err);
    }
    if (files){
        for (var i=0; i<files.length; i++){
            try {
                var fd = fs.writeFileSync(tmpDir + '/' + files[i], '');
            } catch (err){
                if (err.code != 'EEXIST')
                    logger.log('warn', 'failed to create tmp file:%s, %j', tmpDir + '/' + files[i], err);
            }
        }
    }
}