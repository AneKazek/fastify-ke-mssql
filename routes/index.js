/**
 * Main routes file
 */
import productsRoutes from './products.js';

export default async function routes(fastify, options) {
  // Register products routes
  fastify.register(productsRoutes, { prefix: '/api' });
  
  // Register your routes here
  fastify.get('/api/hello', async (request, reply) => {
    return { hello: 'world' };
  });
  
  // Example of a parameterized route
  fastify.get('/api/users/:id', async (request, reply) => {
    const { id } = request.params;
    return { userId: id, message: `Fetching data for user ${id}` };
  });
  
  // Legacy route to maintain compatibility with old code
  fastify.get('/data', async (request, reply) => {
    reply.redirect(307, '/api/products');
  });
}
