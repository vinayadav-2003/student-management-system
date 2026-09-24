/**
 * db.js - PostgreSQL adapter with MSSQL-compatible API
 *
 * This adapter wraps the `pg` library to provide an API that mirrors the
 * `mssql` library used originally. This means all existing routes using
 * pool.request().input(...).query(...) and result.recordset will work
 * WITHOUT modification.
 *
 * MSSQL syntax converted automatically:
 *  - @paramName  → $1, $2, ...  (positional params)
 *  - TOP N       → LIMIT N
 *  - GETUTCDATE() → NOW()
 *  - IDENTITY    → SERIAL (handled in dbInit)
 *  - OUTPUT INSERTED.* → RETURNING *
 *  - OUTPUT DELETED.*  → RETURNING *
 *  - NVARCHAR    → TEXT (handled in dbInit)
 *  - IF NOT EXISTS (SELECT * FROM sys.tables ...) → handled in dbInit
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// --- PostgreSQL Connection Pool ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err);
});

// ─── SQL Query Translator ─────────────────────────────────────────────────────
/**
 * Converts MSSQL-style parameterized query to PostgreSQL style.
 *
 * Replaces @paramName with $1, $2, ... in the order they were registered
 * via .input() calls.
 */
function translateQuery(mssqlQuery, paramNames) {
  let pgQuery = mssqlQuery;

  // Replace OUTPUT INSERTED.* with RETURNING *
  pgQuery = pgQuery.replace(/OUTPUT\s+INSERTED\.\*/gi, 'RETURNING *');
  // Replace OUTPUT DELETED.* with RETURNING *
  pgQuery = pgQuery.replace(/OUTPUT\s+DELETED\.\*/gi, 'RETURNING *');
  // Replace OUTPUT INSERTED.<col> with RETURNING <col>
  pgQuery = pgQuery.replace(/OUTPUT\s+INSERTED\.(\w+)/gi, 'RETURNING $1');

  // Replace TOP N with LIMIT N
  pgQuery = pgQuery.replace(/\bTOP\s+(\d+)\b/gi, 'LIMIT $1');
  // Move LIMIT to end if it's at the start of SELECT clause
  // Pattern: SELECT LIMIT N ... FROM -> SELECT ... FROM ... LIMIT N
  pgQuery = pgQuery.replace(
    /SELECT\s+LIMIT\s+(\d+)\s+([\s\S]*?)\s+FROM\s+/gi,
    (match, limit, cols, offset) => `SELECT ${cols} FROM `,
  );
  // Re-apply LIMIT at end for TOP translations
  pgQuery = pgQuery.replace(
    /^(SELECT)\s+LIMIT\s+(\d+)\s+/gi,
    (_m, sel, n) => `${sel} `,
  );

  // Replace GETUTCDATE() with NOW()
  pgQuery = pgQuery.replace(/GETUTCDATE\(\)/gi, 'NOW()');

  // Replace IF NOT EXISTS sys.tables checks (handled in dbInit, skip here)
  // These should not appear in route queries but just in case:
  pgQuery = pgQuery.replace(/IF\s+NOT\s+EXISTS[\s\S]*?END/gi, '');

  // Replace @paramName with positional $n placeholders
  // Build a map: paramName → index
  const paramMap = {};
  paramNames.forEach((name, i) => {
    paramMap[name.toLowerCase()] = i + 1;
  });

  // Replace all @paramName occurrences
  pgQuery = pgQuery.replace(/@(\w+)/g, (match, name) => {
    const idx = paramMap[name.toLowerCase()];
    if (idx !== undefined) {
      return `$${idx}`;
    }
    // Unknown param — leave as-is (will cause PG error, easier to debug)
    return match;
  });

  // Fix LIMIT placement: if SELECT ... LIMIT N FROM ... → SELECT ... FROM ... LIMIT N
  // This handles the TOP → LIMIT translation that ends up in wrong position
  const limitInSelectMatch = pgQuery.match(/^(\s*SELECT\s+)(LIMIT\s+\d+\s+)([\s\S]+?)(FROM\s+[\s\S]+)$/i);
  if (limitInSelectMatch) {
    const limitClause = limitInSelectMatch[2].trim();
    pgQuery = `${limitInSelectMatch[1]}${limitInSelectMatch[3]}${limitInSelectMatch[4]} ${limitClause}`;
  }

  return pgQuery;
}

// ─── MSSQL-Compatible Request Builder ────────────────────────────────────────
/**
 * Returns a request object that mimics the mssql Request API:
 *   request.input(name, type, value)
 *   request.query(sql)  → Promise<{ recordset: rows[] }>
 */
function createRequest() {
  const params = [];      // [{ name, value }]
  const paramNames = [];  // ordered list of param names

  const request = {
    input(name, typeOrValue, value) {
      // mssql: .input(name, sql.Type, value) OR .input(name, value)
      const actualValue = value !== undefined ? value : typeOrValue;
      // Check if already registered (update value)
      const existing = params.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.value = actualValue;
      } else {
        params.push({ name, value: actualValue });
        paramNames.push(name);
      }
      return request; // chainable
    },

    async query(mssqlSql) {
      const pgSql = translateQuery(mssqlSql, paramNames);
      const values = paramNames.map(name => {
        const p = params.find(p => p.name.toLowerCase() === name.toLowerCase());
        return p ? p.value : null;
      });

      try {
        const result = await pool.query(pgSql, values);
        return {
          recordset: result.rows,
          rowsAffected: [result.rowCount],
        };
      } catch (err) {
        // Enhance error message with SQL for easier debugging
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

// ─── Pool-like Object (MSSQL-Compatible) ─────────────────────────────────────
const pgPool = {
  request: () => createRequest(),

  // Direct query without params (for simple queries)
  async query(sql, values) {
    const result = await pool.query(sql, values);
    return {
      recordset: result.rows,
      rowsAffected: [result.rowCount],
    };
  },
};

async function getPool() {
  return pgPool;
}

// ─── MSSQL sql types shim (not needed for pg but keeps imports working) ───────
const sql = {
  NVarChar: 'NVarChar',
  Int: 'Int',
  DateTime: 'DateTime',
  Bit: 'Bit',
  Float: 'Float',
  BigInt: 'BigInt',
  VarChar: 'VarChar',
  Text: 'Text',
};

module.exports = { sql, getPool };