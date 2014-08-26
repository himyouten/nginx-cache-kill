var logger = require('winston');
var path = require('path');
var fs = require('fs');
var cache = require('../config/cache.js');
var urlparser = require('url');
var md5 = require('MD5');
var redis = require('redis');


/**
 * NginxCacheKill object that does the actual purging
 */
var NginxCacheKill = function(site_configs, default_config){
    this.__default_config = {cache_levels: '1:2', cache_dir: '/var/spool/nginx', redis: {host:'127.0.0.1', port:6379}};

    this.init = function(site_configs, default_config){
        logger.log('debug', site_configs);
        logger.log('debug', default_config);
        // set up the configs
        if (typeof(default_config)==='undefined'){
            this.default_config = this.__default_config;
        } else {
            this.default_config = default_config;
        }
        
        // generate the default cache regex
        this.createCacheRegexes(site_configs);
        
        // set up the redis
        this.createRedisClients();
        
    }
    
    this.createCacheRegexes = function(site_configs){
        var cache_regex = this.buildRegex(this.default_config.cache_levels);
        this.default_config.cache_regex = cache_regex;
    
        // if site_configs is defined - validate cache_levels and cache_dir, set to defaults if not set, then generate the cache regexs for it's cache levels
        if (!(typeof(site_configs)==='undefined')){
            this.site_configs = site_configs;
            for (var domain in this.site_configs){
                if (
                    typeof(this.site_configs[domain].cache_levels)==='undefined' || 
                    this.site_configs[domain].cache_levels == null 
                ) this.site_configs[domain].cache_levels = cache_levels;

                if (
                    typeof(this.site_configs[domain].cache_dir)==='undefined' || 
                    this.site_configs[domain].cache_dir == null || 
                    this.site_configs[domain].cache_dir.length == 0
                ) this.site_configs[domain].cache_dir = cache_dir;
            
                cache_regex = this.buildRegex(this.site_configs[domain].cache_levels);
                this.site_configs[domain].cache_regex = cache_regex;
            }
        }
    }
    
    this.createRedisClients = function(){
        logger.log('debug', 'connecting to redis at %s:%s', this.default_config.redis.host, this.default_config.redis.port);
        var redisClient = redis.createClient(this.default_config.redis.port, this.default_config.redis.host, {retry_max_delay: 5000, connect_timeout: 1000, max_attempts: 5});
        redisClient.on("connect", function(){
            this.redisClient = redisClient;
            logger.log('debug','redis connected at %s:%s', this.redisClient.host, this.redisClient.port);
        });
        redisClient.on('error', function(err){
            logger.log('error','redis error - %s:%s - '+err, redisClient.host, redisClient.port);
        });
    }
    
    /**
     * get config for domain
     * @domain - the domain/url to look up for the config
     * @isUrl - if true, domain argument is treated as url and domain is parsed from it
     **/
    this.getConfig = function(domain, isUrl){
        if (typeof(this.site_configs)==='undefined') return this.default_config;
        if (!(typeof(isUrl)==='undefined') && isUrl){
            domain = urlparser.parse(domain).hostname;
        }
        if (!(domain in this.site_configs)) {
            logger.log("warn","config not found using defaults for " + domain);
            return this.default_config;
        }
        return this.site_configs[domain];
    }
    
    /**
     * does the actual removal, gets the hash and removes from file system
     * @url - the url to purge
     **/
    this.purgeUrl = function(url){
        var filepath = this.getCacheFilePath(url);
        logger.log("debug","url:" + url + " with file:" + filepath + " - attempting to delete");
        fs.unlink(filepath, function(err){
            if (err){
                logger.log("error", "url:" + url + " with file:" + filepath + " was not deleted - " + err);
            }
        });
    }

    /**
     * returns the cache file path to purge
     * @url - the url to purge
     **/
    this.getCacheFilePath = function(url){
    	// urlmd5=`echo -n "$url" |openssl md5|cut -f2 -d" "`
        // FILE=`echo "$urlmd5" | sed -rn 's/'$MATCH'/'$REPLACE'/p'`
    	var urlhash = md5(url);
    	var config = this.getConfig(url, true);
        logger.log("debug","using match:%s replace:%s for:%s", config.cache_regex.match, config.cache_regex.replace, url);
        // var filepath = config.cache_dir + '/' + urlhash.replace('^' + config.cache_regex.match + '$', config.cache_regex.replace, urlhash);
        var filepath = config.cache_dir + '/' + urlhash.replace(config.cache_regex.matchRegExp, config.cache_regex.replace, urlhash);
        logger.log("debug","url:%s with hash:%s should be at:%s", url, urlhash, filepath);
        return filepath;
    }

    // gets the related urls from redis node and purges them
    this.purgeRelated = function(url){
        logger.log('debug','purging related urls for:%s', url);
        this.redisClient.smembers(url, function(err, urls){
            if (err){
                logger.log('error', 'redis smembers error:%s', err);
                return;
            }
            logger.log('debug','%s related urls found for:%s', urls.length, url);
            for (var i = 0; i < urls.length; i++) {
                this.purgeUrl(urls[i]);
            }
        });
    }

    // build the regex required to get the full path to the hash file
    this.buildRegex = function(cache_levels){
    	var count = 2;
    	var level = 0;
    	var match = '';
    	var replace = '';
        logger.log("debug","cache levels:" + cache_levels);
    	if (cache_levels === undefined){
            logger.log("error","no cache levels sent");
    		throw "no cache levels found";
    	}
        cache_levels = cache_levels.split(':');
    	if (cache_levels.length == 0){
            logger.log("error","cache levels empty");
    		throw "cache levels empty";
    	}
    	for (var i=0; i < cache_levels.length; i++){
    	    level =  cache_levels[i];
            logger.log("debug","doing cache level:"+level);
    	    match = "(.{" + level + "})" + match;
    	    replace = "$" + count + "/" + replace;
            logger.log("debug","match:%s replace:%s", match, replace);
    	    count++;
    	}

    	if (match == ""){
            logger.log("error","empty regex");
    		throw "empty regex";
    	}

    	match = "^(.*?" + match + ")$";
    	replace = replace + "$1";
        logger.log("debug","match:%s replace:%s", match, replace);
    	return {match: match, matchRegExp: new RegExp(match), replace: replace};
    }

    // purges the url, fetches related from redis if available
    this.purge = function(url){
        this.purgeUrl(url);
    	var config = this.getConfig(url, true);
        logger.log("debug","check related:%s redis:%s for:%s", config.has_related);
        if (config.has_related)
            this.purgeRelated(url);
    }
        
    // initialise the object
    this.init(site_configs, default_config);
    
}

module.exports = NginxCacheKill;