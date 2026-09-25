/**
 * db.js - Dual-engine Database Adapter (PostgreSQL & MSSQL)
 *
 * Automatically detects environment:
 * - On Linux / Render or when DATABASE_URL is set: connects to PostgreSQL
 *   and automatically translates MSSQL syntax to PostgreSQL.
 * - On Windows: connects to MSSQL via SQL Auth (if DB_USER/DB_PASSWORD)
 *   or local Windows Authentication (msnodesqlv8).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const isPostgres = Boolean(process.env.DATABASE_URL) || process.platform !== 'win32';

let sql;
let getPool;

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const normalized = { ...row };
    for (const key of Object.keys(row)) {
      const pascal = key.charAt(0).toUpperCase() + key.slice(1);
      const lower = key.toLowerCase();
      if (!(pascal in normalized)) normalized[pascal] = row[key];
      if (!(lower in normalized)) normalized[lower] = row[key];
    }
    return normalized;
  });
}

if (isPostgres) {
  // ─── PostgreSQL Mode (Linux, Render, Railway, Supabase) ─────────────────────
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres',
    ssl:
      process.env.DATABASE_URL &&
      (process.env.DATABASE_URL.includes('railway') ||
        process.env.DATABASE_URL.includes('render') ||
        process.env.DATABASE_URL.includes('supabase') ||
        process.env.DATABASE_URL.includes('neon') ||
        process.env.NODE_ENV === 'production')
        ? { rejectUnauthorized: false }
        : false,
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL Pool Notice:', err.message);
  });

  function translateQuery(mssqlQuery, paramNames) {
    let pgQuery = mssqlQuery;

    // 1. Extract OUTPUT INSERTED / DELETED to append as trailing RETURNING clause
    let returningClause = '';
    pgQuery = pgQuery.replace(/OUTPUT\s+INSERTED\.\*/gi, () => {
      returningClause = ' RETURNING *';
      return '';
    });
    pgQuery = pgQuery.replace(/OUTPUT\s+DELETED\.\*/gi, () => {
      returningClause = ' RETURNING *';
      return '';
    });
    pgQuery = pgQuery.replace(/OUTPUT\s+INSERTED\.(\w+)/gi, (match, col) => {
      returningClause = ` RETURNING "${col}"`;
      return '';
    });

    // 2. Map @paramName to $1, $2, ... BEFORE column quoting so params like @createdBy are not quoted
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

    // 3. TOP N translation
    pgQuery = pgQuery.replace(/\bTOP\s+(\d+)\b/gi, 'LIMIT $1');
    pgQuery = pgQuery.replace(
      /SELECT\s+LIMIT\s+(\d+)\s+([\s\S]*?)\s+FROM\s+/gi,
      (match, limit, cols) => `SELECT ${cols} FROM `,
    );
    pgQuery = pgQuery.replace(
      /^(SELECT)\s+LIMIT\s+(\d+)\s+/gi,
      (_m, sel) => `${sel} `,
    );

    // 4. MSSQL functions
    pgQuery = pgQuery.replace(/GETUTCDATE\(\)/gi, 'NOW()');
    pgQuery = pgQuery.replace(/IF\s+NOT\s+EXISTS[\s\S]*?END/gi, '');

    // 5. Replace table names with double quotes for PostgreSQL case-sensitivity
    pgQuery = pgQuery.replace(/(?<!["\w])Users(?!["\w])/g, '"Users"');
    pgQuery = pgQuery.replace(/(?<!["\w])Students(?!["\w])/g, '"Students"');
    pgQuery = pgQuery.replace(/(?<!["\w])States(?!["\w])/g, '"States"');
    pgQuery = pgQuery.replace(/(?<!["\w])Cities(?!["\w])/g, '"Cities"');
    pgQuery = pgQuery.replace(/(?<!["\w])Courses(?!["\w])/g, '"Courses"');

    // 6. Replace Users column names with double quotes
    const userColumns = [
      'Id', 'Name', 'Role', 'Email', 'Phone', 'Password',
      'Force_Password', 'CreatedBy', 'CreatedDate', 'UpdatedBy',
      'UpdatedDate', 'TempPassword', 'IsTempPassword'
    ];
    for (const col of userColumns) {
      const reg = new RegExp(`(?<!["\\w])${col}(?!["\\w])`, 'g');
      pgQuery = pgQuery.replace(reg, `"${col}"`);
    }

    // Special columns in other tables
    pgQuery = pgQuery.replace(/(?<!["\w])stateId(?!["\w])/g, '"stateId"');
    pgQuery = pgQuery.replace(/(?<!["\w])createdBy(?!["\w])/g, '"createdBy"');
    pgQuery = pgQuery.replace(/(?<!["\w])createdDate(?!["\w])/g, '"createdDate"');

    // 7. Boolean literal conversions
    pgQuery = pgQuery.replace(/,\s*0\s*\)/g, ', FALSE)');
    pgQuery = pgQuery.replace(/,\s*1\s*\)/g, ', TRUE)');

    // 8. Fix LIMIT position in SELECT
    const limitInSelectMatch = pgQuery.match(
      /^(\s*SELECT\s+)(LIMIT\s+\d+\s+)([\s\S]+?)(FROM\s+[\s\S]+)$/i,
    );
    if (limitInSelectMatch) {
      const limitClause = limitInSelectMatch[2].trim();
      pgQuery = `${limitInSelectMatch[1]}${limitInSelectMatch[3]}${limitInSelectMatch[4]} ${limitClause}`;
    }

    // 9. Append returningClause at the end
    if (returningClause && !pgQuery.toLowerCase().includes('returning')) {
      pgQuery = pgQuery.trim() + returningClause;
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
        if (!process.env.DATABASE_URL) {
          console.warn('DATABASE_URL is not set on cloud host.');
          return { recordset: [], rowsAffected: [0] };
        }

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
            recordset: normalizeRows(result.rows),
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
      if (!process.env.DATABASE_URL) {
        return { recordset: [], rowsAffected: [0] };
      }
      const pgSql = translateQuery(queryString, []);
      const result = await pool.query(pgSql, values);
      return {
        recordset: normalizeRows(result.rows),
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
  // ─── MSSQL Mode (Windows Local or SQL Server) ─────────────────────────────────
  let mssqlLib;
  let mssqlConfig;

  try {
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
  } catch (err) {
    try {
      mssqlLib = require('mssql');
    } catch (e2) {
      console.warn('MSSQL driver not available:', err.message);
    }
  }

  sql = mssqlLib;

  let pool;
  let poolReady = false;
  getPool = async () => {
    if (!poolReady && sql) {
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