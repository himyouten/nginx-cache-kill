var fs = require("fs");
var assert = require("assert");
var app = require('../app.js');
var config = require('../config/config');
var logger = require('winston');
var redis = require('redis');
var request = require('supertest');
var testUtils = require('../lib/test-utils');

var redisHost = config.get('cachekill:default:redis:host');
var redisPort = config.get('cachekill:default:redis:port');

var tmpDir = './test/tmp';
var url = 'http://my.test/purgeTest.htm';
var urlhash = '3a7fe5ce0ce354896335e1517f013749';

var urlRelated = 'http://my.testrelated/purgeTest.htm';
var urlRelatedHash = '3f1e26881695e5719c81e0cfca1b38cb';
var urlhashRelated1 = '40746ac599f61aa83c594def3a6d541f';
var urlhashRelated2 = '6a96d2706d02f82d8f7ca6324c050f6d'


describe('routes/cachekill.js', function(){
    
    describe('#GET', function(){

        beforeEach(function(done){
            testUtils.initTmpDir(tmpDir, [urlhash, urlRelatedHash, urlhashRelated1, urlhashRelated2]);
            testUtils.initRedis(redisHost, redisPort, done);
        });
        
        it('should error', function(done){
            request(app)
                .get('/api/kill')
                .expect(400, done);
        });
        
        it('should delete single url', function(done){
            request(app)
                .get('/api/kill?url='+url)
                .expect(200, done);
        });

        it('should delete related also', function(done){
            request(app)
                .get('/api/kill?url='+urlRelated)
                .expect(200, done);
        });

    });    
    
    describe('#POST', function(){

        beforeEach(function(done){
            testUtils.initTmpDir(tmpDir, [urlhash, urlRelatedHash, urlhashRelated1, urlhashRelated2]);
            testUtils.initRedis(redisHost, redisPort, done);
        });
        
        it('should error', function(done){
            request(app)
                .post('/api/kill')
                .expect(400, done);
        });
        
        it('should delete single url', function(done){
            var postdata = {url: url};
            request(app)
                .post('/api/kill')
                .send(postdata)
                .expect(200, done);
        });

        it('should delete related also', function(done){
            var postdata = {url: [url, urlRelated]};
            request(app)
                .post('/api/kill')
                .send(postdata)
                .expect(200, done);
        });
        
    });    
});    