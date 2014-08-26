var fs = require("fs");
var assert = require("assert");
var app = require('../app.js');
var logger = require('winston');
var redis = require('redis');
var request = require('supertest');

var tmpDir = './test/tmp';

describe('routes/cachekill.js', function(){
    
    describe('#GET', function(){
        var url = 'http://my.test/purgeTest.htm';
        var urlhash = '3a7fe5ce0ce354896335e1517f013749';

        var urlRelated = 'http://my.testrelated/purgeTest.htm';
        var urlRelatedHash = '3f1e26881695e5719c81e0cfca1b38cb';
        var urlhashRelated1 = '40746ac599f61aa83c594def3a6d541f';
        var urlhashRelated2 = '6a96d2706d02f82d8f7ca6324c050f6d'

        beforeEach(function(done){
            try {
                fs.mkdirSync(tmpDir)
            } catch (err){
                logger.log('warn', 'failed to mkdir tmpDir:%s, %s', tmpDir, err);
            }
            try {
                var fd = fs.writeFileSync(tmpDir + '/' + urlhash, '');
                var fd = fs.writeFileSync(tmpDir + '/' + urlRelatedHash, '');
                var fd = fs.writeFileSync(tmpDir + '/' + urlhashRelated1, '');
                var fd = fs.writeFileSync(tmpDir + '/' + urlhashRelated2, '');
            } catch (err){
                logger.log('warn', 'failed to create tmp file:%s, %s', tmpDir + '/' + urlhash, err);
            }
            done();
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
        var url = 'http://my.test/purgeTest.htm';
        var urlhash = '3a7fe5ce0ce354896335e1517f013749';

        var urlRelated = 'http://my.testrelated/purgeTest.htm';
        var urlRelatedHash = '3f1e26881695e5719c81e0cfca1b38cb';
        var urlhashRelated1 = '40746ac599f61aa83c594def3a6d541f';
        var urlhashRelated2 = '6a96d2706d02f82d8f7ca6324c050f6d'

        beforeEach(function(done){
            try {
                fs.mkdirSync(tmpDir)
            } catch (err){
                logger.log('warn', 'failed to mkdir tmpDir:%s, %s', tmpDir, err);
            }
            try {
                var fd = fs.writeFileSync(tmpDir + '/' + urlhash, '');
                var fd = fs.writeFileSync(tmpDir + '/' + urlRelatedHash, '');
                var fd = fs.writeFileSync(tmpDir + '/' + urlhashRelated1, '');
                var fd = fs.writeFileSync(tmpDir + '/' + urlhashRelated2, '');
            } catch (err){
                logger.log('warn', 'failed to create tmp file:%s, %s', tmpDir + '/' + urlhash, err);
            }
            done();
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