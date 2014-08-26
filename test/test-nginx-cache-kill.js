describe('nginx-cache-kill', function(){
    var NginxCacheKill = require('../lib/nginx-cache-kill.js');
    var fs = require("fs")
    var assert = require("assert")
    var config = require('../config/config');
    var logger = require('../config/log')(config);
    var redis = require('redis');

    var tmpDir = './test/tmp';
    var testConfig = {
        cachekill: {
            default: {
                cache_levels: '1:2',
                cache_dir: '/var/spool/nginx',
                has_related: false,
                redis: {
                    host: '127.0.0.1',
                    port: 6379
                }
            },
            sites: {
                'my.domain': {
                    cache_levels: '1:2',
                    cache_dir: '/var/spool/nginx'
                },
                'my.test': {
                    cache_levels: '',
                    cache_dir: tmpDir
                },
                'my.testRelated': {
                    cache_levels: '',
                    cache_dir: tmpDir,
                    has_related: true,
                }
            }
        }
    };

    config.overrides(testConfig);
    var nginxCache = new NginxCacheKill(config.get('cachekill:sites'), config.get('cachekill:default'));
    var redisClient = null;
    try {
        
        logger.log('info','test connecting to redis %s:%s', testConfig.cachekill.default.redis.host, testConfig.cachekill.default.redis.port);
        var redisClient = redis.createClient(testConfig.cachekill.default.redis.port, testConfig.cachekill.default.redis.host);
        
        logger.log('info', 'test connected to %s:%s', redisClient.host, redisClient.port);
        redisClient.on("error", function(err){
            logger.log('error', 'redis error:'+err)
        });
        redisClient.on("connect", function(){
            logger.log('info', 'test redis connected');
            redisClient.sadd(url, 'http://my.testrelated/purgeTest.htm?related1');
            redisClient.sadd(url, 'http://my.testrelated/purgeTest.htm?related2');
            redisClient.smembers(url, function(err, urls){
                if (err){ 
                    logger.log('error', 'test error fetching related urls, '+err);
                    return;
                }
                logger.log('info', 'test related urls added: '+urls);
            });
        });

    } catch (err){
        logger.log('warn', 'test cannot connect to redis');
    }
    
    describe('#getConfig()', function(){
        
        it('should use default settings', function(done){
            assert.equal(nginxCache.getConfig('').cache_levels, config.get('cachekill:default:cache_levels'), 'default cache_levels should be "'+config.get('cachekill:default:cache_levels')+'"');
            assert.equal(nginxCache.getConfig('').cache_dir, config.get('cachekill:default:cache_dir'), 'default cache_dir should be "'+config.get('cachekill:default:cache_dir')+'"');
            done();
        });

        it('should use default settings if domain does not exist in site settings', function(done){
            assert.equal(nginxCache.getConfig('baddomain').cache_levels, config.get('cachekill:default:cache_levels'), 'default cache_levels should be "'+config.get('cachekill:default:cache_levels')+'"');
            assert.equal(nginxCache.getConfig('baddomain').cache_dir, config.get('cachekill:default:cache_dir'), 'default cache_dir should be "'+config.get('cachekill:default:cache_dir')+'"');
            done();
        });
        
        it('should use my.domain settings', function(done){
            assert.equal(nginxCache.getConfig('my.domain').cache_levels, config.get('cachekill:sites:my.domain:cache_levels'), 'my.domain cache_levels should be "'+config.get('cachekill:default:cache_levels')+'"');
            assert.equal(nginxCache.getConfig('my.domain').cache_dir, config.get('cachekill:sites:my.domain:cache_dir'), 'my.domain cache_dir should be "'+config.get('cachekill:default:cache_dir')+'"');
            done();
        });
        
        it('should use my.domain settings from url', function(done){
            assert.equal(nginxCache.getConfig('http://my.domain/some/path', true).cache_levels, config.get('cachekill:sites:my.domain:cache_levels'), 'my.domain cache_levels should be "'+config.get('cachekill:default:cache_levels')+'"');
            done();
        });
        
        it('should allow empty cache_levels', function(done){
            assert.equal(nginxCache.getConfig('my.test').cache_levels, '', 'cache_levels should be empty');
            done();
        });
    });
    
    describe('#buildRegex()', function(){
        var defaultMatch = '^(.*?(.{2})(.{1}))$';
        var defaultReplace = '$3/$2/$1'
        
        it('should return match:'+defaultMatch+' for default cache_levels 1:2', function(done){
            assert.equal(nginxCache.getConfig('').cache_regex.match, defaultMatch, 'default match should be "'+defaultMatch+'"');
            done();
        });

        it('should return replace:'+defaultReplace+' for default cache_levels 1:2', function(done){
            assert.equal(nginxCache.getConfig('').cache_regex.replace, defaultReplace, 'default replace should be "'+defaultReplace+'"');
            done();
        });
    });
    
    describe('#getCacheFilePath()', function(){
        var urls = { 
            'http://baddomain/some/path':'/1/b4/dde9cfb0cce5d4e7e7267999cb30bb41', 
            'http://my.domain/some/path':'/b/6c/76d9569f6783fe8d3675487993b686cb', 
            'http://my.test/some/path':'/df8b3d7630cb66b494a112cc162e274e'
        };
        it('should return the full path to the cache file', function(done){
            for (var url in urls){
                var cache_dir = nginxCache.getConfig(url, true).cache_dir;
                assert.equal(nginxCache.getCacheFilePath(url), cache_dir + urls[url]);
            }
            done();
        })
    });
    
    describe('#purgeUrl()', function(){
        var url = 'http://my.test/purgeUrlTest.htm';
        var urlhash = 'a8eaceed55be868b1b7058c37cc12f76';

        beforeEach(function(){
            try {
                fs.mkdirSync(tmpDir)
            } catch (err){
                logger.log('warn', 'failed to mkdir tmpDir:%s, %s', tmpDir, err);
            }
            try {
                var fd = fs.writeFileSync(tmpDir + '/' + urlhash, '');
            } catch (err){
                logger.log('warn', 'failed to create tmp file:%s, %s', tmpDir + '/' + urlhash, err);
            }
        });
        
        it('should remove the cache file', function(done){
            assert.ok(fs.statSync(tmpDir + '/' + urlhash).isFile(), 'missing test hash file');
            nginxCache.purgeUrl(url);
            logger.log('info', 'file %s isExists:%s', tmpDir + '/' + urlhash, fs.existsSync(tmpDir + '/' + urlhash));
            assert.equal(fs.existsSync(tmpDir + '/' + urlhash), false, 'test hash file not deleted');
            done();
        });
    });
    
    describe('#purge()', function(){
        var url = 'http://my.test/purgeTest.htm';
        var urlhash = '3a7fe5ce0ce354896335e1517f013749';

        beforeEach(function(){
            try {
                fs.mkdirSync(tmpDir)
            } catch (err){
                logger.log('warn', 'failed to mkdir tmpDir:%s, %s', tmpDir, err);
            }
            try {
                var fd = fs.writeFileSync(tmpDir + '/' + urlhash, '');
            } catch (err){
                logger.log('warn', 'failed to create tmp file:%s, %s', tmpDir + '/' + urlhash, err);
            }
        });
        
        it('should remove the cache file and related from redis', function(done){
            assert.ok(fs.statSync(tmpDir + '/' + urlhash).isFile(), 'missing test hash file');
            nginxCache.purge(url);
            logger.log('info', 'file %s isExists:%s', tmpDir + '/' + urlhash, fs.existsSync(tmpDir + '/' + urlhash));
            assert.equal(fs.existsSync(tmpDir + '/' + urlhash), false, 'test hash file not deleted');
            done();
        });
    });    
    
    describe('#purgeRelated()', function(){
        var url = 'http://my.testrelated/purgeTest.htm';
        // var urlhash = '3f1e26881695e5719c81e0cfca1b38cb';
        var urlhashRelated1 = '40746ac599f61aa83c594def3a6d541f';
        var urlhashRelated2 = '6a96d2706d02f82d8f7ca6324c050f6d'
        beforeEach(function(){
            try {
                fs.mkdirSync(tmpDir)
            } catch (err){
                logger.log('warn', 'failed to mkdir tmpDir:%s, %s', tmpDir, err);
            }
            try {
                // fs.writeFileSync(tmpDir + '/' + urlhash, '');
                fs.writeFileSync(tmpDir + '/' + urlhashRelated1, '');
                fs.writeFileSync(tmpDir + '/' + urlhashRelated2, '');
            } catch (err){
                logger.log('warn', 'failed to create tmp files in:%s, %s', tmpDir, err);
            }
        });

        it('should remove the cache file and related from redis', function(done){
            assert.ok(fs.statSync(tmpDir + '/' + urlhashRelated1).isFile(), 'missing test hash related1 file');
            assert.ok(fs.statSync(tmpDir + '/' + urlhashRelated2).isFile(), 'missing test hash related2 file');
            nginxCache.purgeRelated(url);
            logger.log('info', 'file %s isExists:%s', tmpDir + '/' + urlhashRelated1, fs.existsSync(tmpDir + '/' + urlhashRelated1));
            assert.equal(fs.existsSync(tmpDir + '/' + urlhashRelated1), false, 'test hash related1 file not deleted');
            assert.equal(fs.existsSync(tmpDir + '/' + urlhashRelated2), false, 'test hash related2 file not deleted');
            done();
        });
    });    
})