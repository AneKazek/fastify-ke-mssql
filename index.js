import Fastify from 'fastify';
import routes from './routes/index.js';
import config from './config/index.js';
import { initializePool, closePool } from './database/index.js';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import compress from '@fastify/compress';

// Create Fastify instance
const fastify = Fastify({
  logger: true,
  trustProxy: true
});

// Register plugins
fastify.register(cors, {
  origin: true, // Allow all origins or specify as needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

fastify.register(compress, {
  encodings: ['gzip', 'deflate', 'br']
});


// Define a simple welcome route
fastify.get('/', async (request, reply) => {
  return { 
    message: 'Welcome to the Fastify API!',
    version: '1.0.0',
    endpoints: [
      '/api/products',
      '/api/products/:id',
      '/api/products/filters/categories'
    ]
  };
});

// Register routes
fastify.register(routes);

// Register Redis client
fastify.decorate('redis', null);
fastify.addHook('onReady', async () => {
  try {
    const redisClient = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
      password: config.redis.password,
      database: config.redis.db,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            fastify.log.error('Too many retries. Giving up on Redis connection.');
            return new Error('Too many retries');
          }
          return Math.min(retries * 50, 500);
        }
      }
    });

    redisClient.on('error', (err) => fastify.log.error('Redis Client Error', err));
    redisClient.on('connect', () => fastify.log.info('Redis Client Connected'));
    redisClient.on('reconnecting', () => fastify.log.warn('Redis Client Reconnecting...'));
    redisClient.on('end', () => fastify.log.info('Redis Client Disconnected'));

    await redisClient.connect();
    fastify.redis = redisClient;
    fastify.log.info('Redis client initialized');
  } catch (err) {
    fastify.log.error('Error initializing Redis client:', err);
    process.exit(1);
  }
});

fastify.addHook('onClose', async (instance) => {
  if (instance.redis && instance.redis.isOpen) {
    await instance.redis.quit();
    instance.log.info('Redis client disconnected');
  }
});

// Graceful shutdown handler
const handleShutdown = async () => {
  fastify.log.info('Shutting down server...');
  
  try {
    // Close database connection
    await closePool();
    // Close Redis connection
    if (fastify.redis && fastify.redis.isOpen) {
      await fastify.redis.quit();
    }
    
    // Close fastify server
    await fastify.close();
    fastify.log.info('Server shutdown complete');
    process.exit(0);
  } catch (err) {
    fastify.log.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('uncaughtException', (error) => {
  fastify.log.error('Uncaught exception:', error);
  handleShutdown();
});

// Run the server!
const start = async () => {
  try {
    // Initialize database connection
    await initializePool();
    fastify.log.info('Database connection initialized');
    
    // Start the server
    await fastify.listen({ 
      port: config.server.port, 
      host: config.server.host 
    });
    
    fastify.log.info(`Server is running at http://localhost:${fastify.server.address().port}`);
    console.log(`Server is running at http://localhost:${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error('Error starting server:', err);
    process.exit(1);
  }
};

start();
