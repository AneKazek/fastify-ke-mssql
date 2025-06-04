/**
 * Configuration settings for the application
 */
export default {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  
  // SQL Server database configuration
  sqlServer: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true', // For Azure
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false', // For local dev
      enableArithAbort: true,
      connectTimeout: 30000, // 30 seconds
      requestTimeout: 30000 // 30 seconds
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
    // Cache TTL in seconds
    cacheTTL: {
      products: process.env.REDIS_PRODUCTS_TTL || 300, // 5 minutes
      productDetail: process.env.REDIS_PRODUCT_DETAIL_TTL || 600 // 10 minutes
    }
  }
};
