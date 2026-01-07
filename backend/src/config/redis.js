const Redis = require('redis');
const logger = require('./logger');

const createRedisClient = () => {
  const client = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('end', () => {
    logger.info('Redis client connection ended');
  });

  return client;
};

module.exports = createRedisClient;