import { executeQuery, sql } from '../database/index.js';

/**
 * Register products routes
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Route options
 */
import config from '../config/index.js';

/**
 * Register products routes
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Route options
 */
export default async function (fastify, options) {
  // Helper function to generate a unique cache key
  const generateCacheKey = (prefix, query) => {
    const sortedQuery = Object.keys(query).sort().reduce((obj, key) => {
      obj[key] = query[key];
      return obj;
    }, {});
    return `${prefix}:${JSON.stringify(sortedQuery)}`;
  };
  // Get products with pagination, filtering, and sorting
  fastify.get('/products', {
    schema: {
      querystring: {
        type: 'object',
        properties: {

          sortBy: { type: 'string', enum: ['kode_brg', 'nama_brg', 'harga_brg', 'merk_brg'], default: 'kode_brg' },
          sortDir: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          search: { type: 'string' },
          divisi: { type: 'string' },
          merk: { type: 'string' },
          seri: { type: 'string' },
          warna: { type: 'string' },

        }
      }
    }
  }, async (request, reply) => {
    try {
      const cacheKey = generateCacheKey('products', request.query);

      // Try to get data from Redis cache
      if (fastify.redis) {
        const cachedData = await fastify.redis.get(cacheKey);
        if (cachedData) {
          request.log.info(`Cache hit for key: ${cacheKey}`);
          return reply.send(JSON.parse(cachedData));
        }
        request.log.info(`Cache miss for key: ${cacheKey}`);
      }

      const {
        sortBy = 'kode_brg',
        sortDir = 'asc',
        search = '',
        divisi = '',
        merk = '',
        seri = '',
        warna = ''
      } = request.query;

      // Build WHERE clause for filtering
      let whereClause = '';
      const whereConditions = [];
      const queryParams = {};

      if (search) {
        whereConditions.push("(b.kode_brg LIKE @search OR b.nama_brg LIKE @search)");
        queryParams.search = `%${search}%`;
      }

      if (divisi) {
        whereConditions.push("d.kode = @divisi");
        queryParams.divisi = divisi;
      }

      if (merk) {
        whereConditions.push("k.kode = @merk");
        queryParams.merk = merk;
      }

      if (seri) {
        whereConditions.push("kt.kode = @seri");
        queryParams.seri = seri;
      }

      if (warna) {
        whereConditions.push("c.kode = @warna");
        queryParams.warna = warna;
      }

      if (whereConditions.length > 0) {
        whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      }

      // Validate sort column to prevent SQL injection
      const validSortColumns = {
        'kode_brg': 'b.kode_brg',
        'nama_brg': 'b.nama_brg',
        'harga_brg': 'b.hrg_konsumen',
        'merk_brg': 'k.kelompok'
      };

      const sortColumn = validSortColumns[sortBy] || 'b.kode_brg';
      const sortDirection = (sortDir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

      // Get total count (for pagination metadata)
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM brg b
        LEFT JOIN divisi d ON d.kode = b.div
        LEFT JOIN kelompok k ON k.kode = b.dept
        LEFT JOIN kategori kt ON kt.kode = b.kategori
        LEFT JOIN clas c ON c.kode = b.clas
        ${whereClause}
      `;

      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult.recordset[0].total;
      // Optimasi: Pastikan kolom yang digunakan dalam WHERE dan JOIN memiliki indeks di database.
      // Contoh: Indeks pada b.kode_brg, b.nama_brg, d.kode, k.kode, kt.kode, c.kode.
      // Indeks pada kolom ORDER BY juga akan meningkatkan kinerja.

      // Query for data (with or without pagination)
      const dataQuery = `
        SELECT 
          b.kode_brg,
          b.nama_brg,
          b.hrg_sup_sbl_ppn,
          b.hrg2,
          b.hrg_konsumen as harga_brg,
          d.kode AS kode_div,
          d.nm_div AS klp,
          k.kode AS kode_merk,
          k.kelompok AS merk_brg,
          kt.kode AS kode_seri,
          kt.nama_kat AS seri_brg,
          c.kode AS kode_warna,
          c.nm_class AS warna_brg,
          b.jml_barang as jml_brg,
          b.link_gbr
        FROM brg b
        LEFT JOIN divisi d ON d.kode = b.div
        LEFT JOIN kelompok k ON k.kode = b.dept
        LEFT JOIN kategori kt ON kt.kode = b.kategori
        LEFT JOIN clas c ON c.kode = b.clas
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
      `;

      // Execute data query
      const dataResult = await executeQuery(dataQuery, queryParams);

      // Set up response object
      const response = {
        data: dataResult.recordset,
      };

      response.metadata = {
        total,
        allRecords: true
      };

      // Send response
      reply.send(response);

      // Store data in Redis cache
      if (fastify.redis) {
        await fastify.redis.set(cacheKey, JSON.stringify(response), 'EX', config.redis.cacheTTL.products);
        request.log.info(`Data cached for key: ${cacheKey}`);
      }

    } catch (err) {
      request.log.error(err);
      reply.status(500).send({
        error: 'Database Error',
        message: 'Error retrieving products',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Get product by ID
  fastify.get('/products/:id', async (request, reply) => {
    try {
      const cacheKey = `product:${request.params.id}`;

      // Try to get data from Redis cache
      if (fastify.redis) {
        const cachedData = await fastify.redis.get(cacheKey);
        if (cachedData) {
          request.log.info(`Cache hit for key: ${cacheKey}`);
          return reply.send(JSON.parse(cachedData));
        }
        request.log.info(`Cache miss for key: ${cacheKey}`);
      }

      const { id } = request.params;

      const query = `
        SELECT 
          b.kode_brg,
          b.nama_brg,
          b.hrg_sup_sbl_ppn,
          b.hrg2,
          b.hrg_konsumen as harga_brg,
          d.kode AS kode_div,
          d.nm_div AS klp,
          k.kode AS kode_merk,
          k.kelompok AS merk_brg,
          kt.kode AS kode_seri,
          kt.nama_kat AS seri_brg,
          c.kode AS kode_warna,
          c.nm_class AS warna_brg,
          b.jml_barang as jml_brg,
          b.link_gbr
        FROM brg b
        LEFT JOIN divisi d ON d.kode = b.div
        LEFT JOIN kelompok k ON k.kode = b.dept
        LEFT JOIN kategori kt ON kt.kode = b.kategori
        LEFT JOIN clas c ON c.kode = b.clas
        WHERE b.kode_brg = @id
      `;

      const result = await executeQuery(query, { id });

      if (result.recordset.length === 0) {
        reply.status(404).send({
          error: 'Not Found',
          message: `Product with ID ${id} not found`
        });
        return;
      }

      const product = result.recordset[0]; // Define product here
      reply.send(product);

      // Store data in Redis cache
      if (fastify.redis) {
        await fastify.redis.set(cacheKey, JSON.stringify(product), 'EX', config.redis.cacheTTL.product);
        request.log.info(`Data cached for key: ${cacheKey}`);
      }

    } catch (err) {
      request.log.error(err);
      reply.status(500).send({
        error: 'Database Error',
        message: 'Error retrieving product details',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Get product categories (for filters)
  fastify.get('/products/filters/categories', async (request, reply) => {
    try {
      const query = `
        SELECT 'divisi' as type, kode as id, nm_div as name FROM divisi
        UNION ALL
        SELECT 'merk' as type, kode as id, kelompok as name FROM kelompok
        UNION ALL
        SELECT 'seri' as type, kode as id, nama_kat as name FROM kategori
        UNION ALL
        SELECT 'warna' as type, kode as id, nm_class as name FROM clas
      `;

      const result = await executeQuery(query);

      // Transform into a more usable format
      const categories = {
        divisi: [],
        merk: [],
        seri: [],
        warna: []
      };

      result.recordset.forEach(item => {
        if (categories[item.type]) {
          categories[item.type].push({
            id: item.id,
            name: item.name
          });
        }
      });

      reply.send(categories);

    } catch (err) {
      request.log.error(err);
      reply.status(500).send({
        error: 'Database Error',
        message: 'Error retrieving categories',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });
}

