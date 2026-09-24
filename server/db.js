const sql = require('mssql/msnodesqlv8');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
  pool: {
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
  },
  options: {
    trustServerCertificate: true,
  }
};

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