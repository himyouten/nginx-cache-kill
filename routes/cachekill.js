var logger = require('winston');
var config = require('../config/config');
var NginxCacheKill = require('../lib/nginx-cache-kill');
var nginxCacheKill = new NginxCacheKill(config.get('cachekill:sites'), config.get('cachekill:default'));

exports.killUrl = function(req, res, next){
    logger.log("debug","cachekill kill requested");
    var url = req.query.url;
    if (url){
        nginxCacheKill.purge(url, function(err, url, filepath){
            if (err) {
                logger.log('error', 'error purging file:%s for url:%s - %s', filepath, url, err);
                return;
            }
            logger.log('debug','purged file:%s for url:%s', filepath, url);
        });
        res.json({status: 'ok'});
    } else {
        res.status(400).json({status: 'failed', errors: 'missing url to purge'});
    }
}

exports.killUrls = function(req, res, next){
    logger.log("debug","cachekill kills requested, multiple urls");
    var url = req.param('url');
    if (url){
        logger.log("debug","killUrls url:"+url);
        var urls = [];
        if (url instanceof Array) {
            urls = url;
        } else {
            logger.log('debug','single url POSTED');
            urls = [url];
        }
        for (var i=0; i < urls.length; i++){
            nginxCacheKill.purge(urls[i], function(err, url, filepath){
                if (err) {
                    logger.log('error', 'error purging file:%s for url:%s - %s', filepath, url, err);
                    return;
                }
                logger.log('debug','purged file:%s for url:%s', filepath, url);
            });
        }
        res.json({status: 'ok'});
    } else {
        res.status(400).json({status: 'failed', errors: 'missing urls to purge'});
    }
}