# Nginx Cache Kill

Description: Node.js based Nginx cache invalidator that uses a Redis db to perform pseudo wildcard invalidation

## Project Setup

Download or pull code.  Requires Node.js and npm to be installed.

1. _Node.js_
2. _npm_
3. _pm2_ would be needed to start/stop the application
4. _Redis_ server to read the related urls from

## Testing

Copy test/config-test.yml into test/tmp so as not to get added to git.  Change the location of the redis host and port and log level.  Do not change any other cachekill settings.  Then reference it as env CONF_FILE and run mocha!

```
$ env CONF_FILE=test/tmp/config.yml mocha
info: confile is yml
info: confile:test/tmp/config.yml loaded


  nginx-cache-kill
    #getConfig()
warn: config not found using defaults for 
warn: config not found using defaults for 
      ✓ should use default settings 
warn: config not found using defaults for baddomain
warn: config not found using defaults for baddomain
      ✓ should use default settings if domain does not exist in site settings 
      ✓ should use my.domain settings 
      ✓ should use my.domain settings from url 
      ✓ should allow empty cache_levels 
    #buildRegex()
warn: config not found using defaults for 
      ✓ should return match:^(.*?(.{2})(.{1}))$ for default cache_levels 1:2 
warn: config not found using defaults for 
      ✓ should return replace:$3/$2/$1 for default cache_levels 1:2 
    #getCacheFilePath()
warn: config not found using defaults for baddomain
warn: config not found using defaults for baddomain
      ✓ should return the full path to the cache file 
    #purgeUrl()
      ✓ should remove the cache file 
      ✓ should remove the cache file and do a callback 
    #purge()
      ✓ should remove the cache file 
      ✓ should remove the cache file and do callback 
    #purgeRelated()
      ✓ should remove the cache file and related from redis 

  routes/cachekill.js
    #GET
      ✓ should error 
      ✓ should delete single url 
      ✓ should delete related also 
    #POST
      ✓ should error 
      ✓ should delete single url 
      ✓ should handle url as array 
      ✓ should handle new line delimited 


  20 passing (185ms)
```

## Deploying

### Install dependencies

- Install Node.js
- Install npm
- Install pm2 to start and stop the application
- Install Redis
- In the main directory, run `npm install` to install the dependencies found in _package.json_

### Configs and logs
- Create a config file, format is either JSON or yml, see `config/config-sample.yml` for an example
- Set the `CONF_FILE` env variable to reference the config file
