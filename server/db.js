/**
 * db.js - Dual-engine Database Adapter (PostgreSQL & MSSQL)
 *
 * Automatically detects environment:
 * - If DATABASE_URL is set: connects to PostgreSQL (Railway, Render, Supabase, Neon)
 *   and automatically translates MSSQL syntax to PostgreSQL.
 * - If DB_USER & DB_PASSWORD are set: connects to MSSQL via SQL Authentication.
 * - Otherwise: connects to local MSSQL via Windows Authentication (msnodesqlv8).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const isPostgres = Boolean(process.env.DATABASE_URL);

let sql;
let getPool;

if (isPostgres) {
  // ─── PostgreSQL Mode ──────────────────────────────────────────────────────────
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
        ? { rejectUnauthorized: false }
        : false,
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL Pool Error:', err);
  });

  function translateQuery(mssqlQuery, paramNames) {
    let pgQuery = mssqlQuery;

    pgQuery = pgQuery.replace(/OUTPUT\s+INSERTED\.\*/gi, 'RETURNING *');
    pgQuery = pgQuery.replace(/OUTPUT\s+DELETED\.\*/gi, 'RETURNING *');
    pgQuery = pgQuery.replace(/OUTPUT\s+INSERTED\.(\w+)/gi, 'RETURNING $1');

    pgQuery = pgQuery.replace(/\bTOP\s+(\d+)\b/gi, 'LIMIT $1');
    pgQuery = pgQuery.replace(
      /SELECT\s+LIMIT\s+(\d+)\s+([\s\S]*?)\s+FROM\s+/gi,
      (match, limit, cols) => `SELECT ${cols} FROM `,
    );
    pgQuery = pgQuery.replace(
      /^(SELECT)\s+LIMIT\s+(\d+)\s+/gi,
      (_m, sel) => `${sel} `,
    );

    pgQuery = pgQuery.replace(/GETUTCDATE\(\)/gi, 'NOW()');
    pgQuery = pgQuery.replace(/IF\s+NOT\s+EXISTS[\s\S]*?END/gi, '');

    const paramMap = {};
    paramNames.forEach((name, i) => {
      paramMap[name.toLowerCase()] = i + 1;
    });

    pgQuery = pgQuery.replace(/@(\w+)/g, (match, name) => {
      const idx = paramMap[name.toLowerCase()];
      if (idx !== undefined) {
        return `$${idx}`;
      }
      return match;
    });

    const limitInSelectMatch = pgQuery.match(
      /^(\s*SELECT\s+)(LIMIT\s+\d+\s+)([\s\S]+?)(FROM\s+[\s\S]+)$/i,
    );
    if (limitInSelectMatch) {
      const limitClause = limitInSelectMatch[2].trim();
      pgQuery = `${limitInSelectMatch[1]}${limitInSelectMatch[3]}${limitInSelectMatch[4]} ${limitClause}`;
    }

    return pgQuery;
  }

  function createRequest() {
    const params = [];
    const paramNames = [];

    const request = {
      input(name, typeOrValue, value) {
        const actualValue = value !== undefined ? value : typeOrValue;
        const existing = params.find(
          (p) => p.name.toLowerCase() === name.toLowerCase(),
        );
        if (existing) {
          existing.value = actualValue;
        } else {
          params.push({ name, value: actualValue });
          paramNames.push(name);
        }
        return request;
      },

      async query(mssqlSql) {
        const pgSql = translateQuery(mssqlSql, paramNames);
        const values = paramNames.map((name) => {
          const p = params.find(
            (param) => param.name.toLowerCase() === name.toLowerCase(),
          );
          return p ? p.value : null;
        });

        try {
          const result = await pool.query(pgSql, values);
          return {
            recordset: result.rows,
            rowsAffected: [result.rowCount],
          };
        } catch (err) {
          console.error('PostgreSQL Query Error:');
          console.error('  Original SQL:', mssqlSql.trim().substring(0, 200));
          console.error('  Translated SQL:', pgSql.trim().substring(0, 200));
          console.error('  Params:', values);
          console.error('  Error:', err.message);
          throw err;
        }
      },
    };

    return request;
  }

  const pgPool = {
    request: () => createRequest(),
    async query(queryString, values) {
      const result = await pool.query(queryString, values);
      return {
        recordset: result.rows,
        rowsAffected: [result.rowCount],
      };
    },
  };

  getPool = async () => pgPool;

  sql = {
    NVarChar: 'NVarChar',
    Int: 'Int',
    DateTime: 'DateTime',
    Bit: 'Bit',
    Float: 'Float',
    BigInt: 'BigInt',
    VarChar: 'VarChar',
    Text: 'Text',
  };
} else {
  // ─── MSSQL Mode (Local or Cloud SQL Server) ───────────────────────────────────
  let mssqlLib;
  let mssqlConfig;

  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    mssqlLib = require('mssql');
    mssqlConfig = {
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
    mssqlLib = require('mssql/msnodesqlv8');
    mssqlConfig = {
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

  sql = mssqlLib;

  let pool;
  let poolReady = false;
  getPool = async () => {
    if (!poolReady) {
      pool = await sql.connect(mssqlConfig);
      pool.on('error', (err) => {
        console.error('SQL Pool Error:', err);
        pool = null;
        poolReady = false;
      });
      poolReady = true;
    }
    return pool;
  };
}

module.exports = { sql, getPool };