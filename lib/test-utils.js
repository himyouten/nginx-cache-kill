var fs = require("fs");
var logger = require('winston');
var redis = require('redis');
var tmpDir = './test/tmp';

exports.initRedis = function(host, port, done){
    try {
        logger.log('info','test connecting to redis %s:%s', host, port);
        var redisClient = redis.createClient(port, host);
        
        logger.log('info', 'test connected to %s:%s', redisClient.host, redisClient.port);
        redisClient.on("error", function(err){
            logger.log('error', 'redis error:'+err)
        });
        redisClient.on("connect", function(){
            logger.log('info', 'test redis connected');
            redisClient.sadd(url, 'http://my.testrelated/purgeTest.htm?related1');
            redisClient.sadd(url, 'http://my.testrelated/purgeTest.htm?related2');
            done();
        });

    } catch (err){
        logger.log('warn', 'test cannot connect to redis');
        done();
    }
}

exports.initTmpDir = function(tmpDir, files){
    try {
        fs.mkdirSync(tmpDir)
    } catch (err){
        logger.log('warn', 'failed to mkdir tmpDir:%s, %s', tmpDir, err);
    }
    if (files){
        for (var i=0; i<files.length; i++){
            try {
                var fd = fs.writeFileSync(tmpDir + '/' + files[i], '');
            } catch (err){
                logger.log('warn', 'failed to create tmp file:%s, %s', tmpDir + '/' + files[i], err);
            }
        }
    }
}