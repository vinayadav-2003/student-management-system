require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

let sql;
let config;

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  // Cloud / SQL Server Authentication (Render, Azure, AWS, etc.)
  sql = require('mssql');
  config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
    },
  };
} else {
  // Local Windows Authentication
  sql = require('mssql/msnodesqlv8');
  config = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
    pool: {
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
    },
    options: {
      trustServerCertificate: true,
    },
  };
}

let pool;
let poolReady = false;
async function getPool() {
  if (!poolReady) {
    pool = await sql.connect(config);
    pool.on('error', (err) => {
      console.error('SQL Pool Error:', err);
      pool = null;
      poolReady = false;
    });
    poolReady = true;
  }
  return pool;
}

module.exports = { sql, getPool };