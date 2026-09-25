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

  function translateQuery(mssqlQuery, params = []) {
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

    // 2. Identify only the @paramName parameters that ACTUALLY exist in the query
    const paramMap = {};
    const boundValues = [];
    let paramIndex = 1;

    const matches = pgQuery.match(/@([a-zA-Z_]\w*)/g) || [];
    for (const m of matches) {
      const pName = m.slice(1).toLowerCase();
      if (!paramMap[pName]) {
        paramMap[pName] = paramIndex++;
        const pObj = Array.isArray(params)
          ? params.find((p) => {
              const name = typeof p === 'object' && p !== null ? p.name : String(p);
              return name && name.toLowerCase() === pName;
            })
          : null;
        boundValues.push(pObj && typeof pObj === 'object' && pObj.value !== undefined ? pObj.value : null);
      }
    }

    pgQuery = pgQuery.replace(/@([a-zA-Z_]\w*)/g, (match, name) => {
      const idx = paramMap[name.toLowerCase()];
      if (idx !== undefined) {
        return `$${idx}`;
      }
      return match;
    });

    // 3. ISNULL -> COALESCE
    pgQuery = pgQuery.replace(/\bISNULL\s*\(/gi, 'COALESCE(');

    // 4. OUTER APPLY (...) AS alias -> LEFT JOIN LATERAL (...) AS alias ON TRUE
    pgQuery = pgQuery.replace(
      /\bOUTER\s+APPLY\s*\(\s*([\s\S]*?)\s*\)\s*AS\s+(\w+)/gi,
      (match, subquery, alias) => {
        let lateralQuery = subquery.trim();
        let limit = '';
        lateralQuery = lateralQuery.replace(/\bSELECT\s+TOP\s+(\d+)\b/i, (m, num) => {
          limit = ` LIMIT ${num}`;
          return 'SELECT';
        });
        if (limit && !lateralQuery.toLowerCase().includes('limit')) {
          lateralQuery += limit;
        }
        return `LEFT JOIN LATERAL (${lateralQuery}) AS ${alias} ON TRUE`;
      }
    );

    // 5. Handle balanced scalar subqueries like ( SELECT TOP 1 ... )
    let searchPos = 0;
    while (true) {
      const match = pgQuery.slice(searchPos).match(/\(\s*SELECT\s+TOP\s+(\d+)\s+/i);
      if (!match) break;

      const subqueryStart = searchPos + match.index;
      const limitNum = match[1];

      let openCount = 0;
      let subqueryEnd = -1;
      for (let i = subqueryStart; i < pgQuery.length; i++) {
        if (pgQuery[i] === '(') openCount++;
        else if (pgQuery[i] === ')') {
          openCount--;
          if (openCount === 0) {
            subqueryEnd = i;
            break;
          }
        }
      }

      if (subqueryEnd === -1) break;

      const contentInside = pgQuery.slice(subqueryStart + 1, subqueryEnd);
      const bodyWithoutTop = contentInside.replace(/^\s*SELECT\s+TOP\s+\d+\s+/i, '');
      let newSubquery = `SELECT ${bodyWithoutTop.trim()}`;
      if (!newSubquery.toLowerCase().includes('limit')) {
        newSubquery += ` LIMIT ${limitNum}`;
      }

      pgQuery = pgQuery.slice(0, subqueryStart) + `(${newSubquery})` + pgQuery.slice(subqueryEnd + 1);
      searchPos = subqueryStart + newSubquery.length + 2;
    }

    // 6. Handle top-level SELECT TOP (\d+)
    pgQuery = pgQuery.replace(
      /^\s*SELECT\s+TOP\s+(\d+)\s+([\s\S]*)$/i,
      (match, num, rest) => {
        let r = rest.trim().replace(/;+\s*$/, '');
        if (!r.toLowerCase().includes('limit')) {
          r += ` LIMIT ${num}`;
        }
        return `SELECT ${r}`;
      }
    );

    // 7. MSSQL functions
    pgQuery = pgQuery.replace(/GETUTCDATE\(\)/gi, 'NOW()');
    pgQuery = pgQuery.replace(/IF\s+NOT\s+EXISTS[\s\S]*?END/gi, '');

    // 8. Replace table names with double quotes for PostgreSQL case-sensitivity
    pgQuery = pgQuery.replace(/(?<!["\w])Users(?!["\w])/g, '"Users"');
    pgQuery = pgQuery.replace(/(?<!["\w])Students(?!["\w])/g, '"Students"');
    pgQuery = pgQuery.replace(/(?<!["\w])States(?!["\w])/g, '"States"');
    pgQuery = pgQuery.replace(/(?<!["\w])Cities(?!["\w])/g, '"Cities"');
    pgQuery = pgQuery.replace(/(?<!["\w])Courses(?!["\w])/g, '"Courses"');

    // 9. Replace Users column names with double quotes
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

    // 10. Boolean literal conversions
    pgQuery = pgQuery.replace(/,\s*0\s*\)/g, ', FALSE)');
    pgQuery = pgQuery.replace(/,\s*1\s*\)/g, ', TRUE)');

    // 11. Append returningClause at the end (stripping any trailing semicolons first)
    if (returningClause && !pgQuery.toLowerCase().includes('returning')) {
      pgQuery = pgQuery.trim().replace(/;+\s*$/, '') + returningClause;
    }

    return { pgSql: pgQuery, boundValues };
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

        const { pgSql, boundValues } = translateQuery(mssqlSql, params);

        try {
          const result = await pool.query(pgSql, boundValues);
          return {
            recordset: normalizeRows(result.rows),
            rowsAffected: [result.rowCount],
          };
        } catch (err) {
          console.error('PostgreSQL Query Error:');
          console.error('  Original SQL:', mssqlSql.trim().substring(0, 200));
          console.error('  Translated SQL:', pgSql.trim().substring(0, 200));
          console.error('  Params:', boundValues);
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
      const { pgSql } = translateQuery(queryString, []);
      const result = await pool.query(pgSql, values || []);
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