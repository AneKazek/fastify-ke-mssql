# Fastify MS SQL Bridge

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/) <mcreference link="https://nodejs.org/" index="2">2</mcreference>
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/) <mcreference link="https://www.fastify.io/" index="0">0</mcreference>
[![MS SQL Server](https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white)](https://www.microsoft.com/en-us/sql-server)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

A high-performance API bridge connecting Fastify web server with Microsoft SQL Server. This lightweight solution provides a simple yet powerful way to expose your MS SQL data through RESTful endpoints.

## ✨ Features

- **High Performance**: Built on Fastify, one of the fastest web frameworks for Node.js <mcreference link="https://www.fastify.io/" index="0">0</mcreference>
- **Connection Pooling**: Efficient SQL Server connection management
- **Robust Error Handling**: Comprehensive error handling for database operations
- **Graceful Shutdown**: Properly handles server termination signals
- **Flexible Filtering**: Advanced product filtering with multiple parameters
- **Schema Validation**: Request validation using Fastify schemas
- **CORS Support**: Cross-origin resource sharing enabled
- **Pagination**: Built-in support for data pagination
- **Sorting**: Flexible sorting options for data retrieval

## 🔧 Prerequisites

- Node.js (v14.x or higher) <mcreference link="https://nodejs.org/" index="2">2</mcreference>
- Microsoft SQL Server (2016 or higher)
- npm or yarn package manager

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/anekazek/fastify-ke-mssql.git
cd fastify-ke-mssql
```

2. Install dependencies:

```bash
npm install
```

3. Configure your database connection in `config/index.js` or use environment variables.

4. Start the server:

```bash
npm start
```

## 🚀 Usage

After starting the server, the API will be available at `http://localhost:3000` (or the port you configured).

### Available Endpoints

- `GET /` - Welcome page with API information
- `GET /api/products` - Get all products with optional filtering and sorting
- `GET /api/products/:id` - Get a specific product by ID
- `GET /api/products/filters/categories` - Get all product categories for filtering

### Example Requests

#### Get all products

```bash
curl http://localhost:3000/api/products
```

#### Get products with filtering and sorting

```bash
curl http://localhost:3000/api/products?sortBy=harga_brg&sortDir=desc&merk=(VALUE)
```

#### Get a specific product

```bash
curl http://localhost:3000/api/products/P001
```

#### Get product categories for filtering

```bash
curl http://localhost:3000/api/products/filters/categories
```

## ⚙️ Configuration

Configuration is managed through the `config/index.js` file or environment variables:

| Configuration | Environment Variable | Default | Description |
|---------------|---------------------|---------|-------------|
| Server Port | PORT | 3000 | The port the server will listen on |
| Server Host | HOST | 0.0.0.0 | The host address to bind to |
| Database User | DB_USER | DB_USER | SQL Server username |
| Database Password | DB_PASSWORD | DB_PASSWORD | SQL Server password |
| Database Server | DB_SERVER | DB_SERVER | SQL Server hostname |
| Database Name | DB_NAME | DB_NAME | Database name |
| Encryption | DB_ENCRYPT | false | Whether to use encryption (for Azure) |
| Trust Server Certificate | DB_TRUST_SERVER_CERT | true | Whether to trust server certificate (for local dev) |

## 🔄 Database Connection

The application establishes a connection pool with SQL Server for efficient query execution. The pool configuration can be adjusted in `config/index.js`:

```javascript
pool: {
  max: 10,  // Maximum number of connections
  min: 0,   // Minimum number of connections
  idleTimeoutMillis: 30000  // How long a connection can be idle before being removed
}
```

## 🤝 Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## 📝 License

This project is licensed under the ISC License - see the <mcfile name="LICENSE" path="d:\Database\fastify-mssql-bridge-docker\LICENSE"></mcfile> file for details.

## 🙏 Acknowledgements

- [Fastify](https://www.fastify.io/) <mcreference link="https://www.fastify.io/" index="0">0</mcreference> - The web framework used
- [node-mssql](https://github.com/tediousjs/node-mssql) <mcreference link="https://github.com/tediousjs/node-mssql" index="1">1</mcreference> - SQL Server client for Node.js
- [Node.js](https://nodejs.org/) <mcreference link="https://nodejs.org/" index="2">2</mcreference> - JavaScript runtime
