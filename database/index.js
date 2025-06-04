import sql from 'mssql';
import config from '../config/index.js';

// Create a connection pool that will be reused
let pool = null;

/**
 * Initialize the database connection pool
 */
export async function initializePool() {
  try {
    if (!pool) {
      console.log('Creating new connection pool...');
      pool = await new sql.ConnectionPool(config.sqlServer).connect();
      console.log('SQL Server connection pool created successfully');
      
      // Handle pool errors
      pool.on('error', err => {
        console.error('SQL Server connection pool error:', err);
        pool = null; // Reset pool on error
      });
    }
    
    return pool;
  } catch (err) {
    console.error('Failed to create connection pool:', err);
    throw err;
  }
}

/**
 * Get the existing connection pool or create a new one
 */
export async function getPool() {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Execute a SQL query with proper error handling
 * @param {string} query - SQL query to execute
 * @param {Object} params - Parameters for the query
 */
export async function executeQuery(query, params = {}) {
  let connection;
  
  try {
    connection = await getPool();
    const request = connection.request();
    
    // Add any parameters
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    return await request.query(query);
  } catch (err) {
    console.error('SQL Query execution error:', err);
    throw err;
  }
}

/**
 * Close the connection pool when the application shuts down
 */
export async function closePool() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('SQL Server connection pool closed');
    }
  } catch (err) {
    console.error('Error closing SQL Server connection pool:', err);
    throw err;
  }
}

// Export the sql instance for special cases
export { sql };

// Initialize pool on module load
initializePool().catch(err => {
  console.error('Failed to initialize database connection pool on startup:', err);
});

