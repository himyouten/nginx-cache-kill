describe('nginx-cache-kill', function(){
    var NginxCacheKill = require('../lib/nginx-cache-kill.js');
    var fs = require("fs")
    var assert = require("assert")
    var config = require('../config/config');
    var logger = require('../config/log')(config);

    var tmpDir = './test/tmp';
    var testConfig = {
        cachekill: {
            default: {
                cache_levels: '1:2',
                cache_dir: '/var/spool/nginx'
            },
            sites: {
                'my.domain': {
                    cache_levels: '1:2',
                    cache_dir: '/var/spool/nginx'
                },
                'my.test': {
                    cache_levels: '',
                    cache_dir: tmpDir
                }
            }
        }
    };

    config.overrides(testConfig);
    var nginxCache = new NginxCacheKill(config.get('cachekill:sites'), config.get('cachekill:default'));
    
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
        var url = 'http://my.test/some/path';
        var urlhash = 'df8b3d7630cb66b494a112cc162e274e';

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
            assert.equal(fs.existsSync(tmpDir + '/' + urlhash), false, 'test hash file not deleted');
            done();
        })
        ;
    });
})