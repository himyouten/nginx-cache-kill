var cache_manager = require('cache-manager');
var memory_cache = cache_manager.caching({store: 'memory', max: 100, ttl: 0});
// should attempt to make unique - keep this method in place to easily add this in
var cachekey = function(key){
    return key;
}
module.exports.memory_cache = memory_cache
module.exports.cachekey = cachekey