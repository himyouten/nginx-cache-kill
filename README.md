# Nginx Cache Invalidator

Description: Node.js based Nginx cache invalidator that uses a Redis db to perform pseudo wildcard invalidation

## Project Setup

Download or pull code.  Requires Node.js and npm to be installed.

1. _Node.js_
2. _npm_
3. _pm2_ would be needed to start/stop the application

## Testing

_How do I run the project's automated tests?_

## Deploying

### Install dependencies

- Install Node.js
- Install npm
- Install pm2 to start and stop the application
- In the main directory, run `npm install` to install the dependencies found in _package.json_

### Configs and logs
- Create a config file, format is either JSON or yml, see `config/config-sample.yml` for an example
- Set the `CONF_FILE` env variable to reference the config file
