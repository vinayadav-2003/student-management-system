# DATABASE CONNECTION — `server/db.js`

## Purpose
Database connection module using the `mssql` package with Windows Authentication. Manages a connection pool for all database operations.

## Dependencies
| Import | Usage |
|--------|-------|
| `mssql` | SQL Server driver and connection pool |

## Configuration
Reads from environment variables:
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SERVER` | `localhost` | SQL Server host |
| `DB_DATABASE` | `School` | Database name |
| `DB_USER` | — | Username (for SQL auth) |
| `DB_PASSWORD` | — | Password (for SQL auth) |
| `DB_DRIVER` | `msnodesqlv8` | Driver (defaults to Windows Auth) |
| `DB_PORT` | `1433` | Port |
| `DB_ENCRYPT` | `true` | Encryption setting |
| `DB_TRUST_SERVER_CERTIFICATE` | `true` | Trust self-signed certs |

## Exported Functions

### `getPool()`
Returns a singleton connection pool. Creates the pool on first call and reuses it.

**Config example (Windows Auth):**
```js
{
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "School",
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
    encrypt: true,
    trustServerCertificate: true
  }
}
```

## Usage Pattern
```js
const { getPool } = require("../db");
const pool = await getPool();
const result = await pool.request()
  .input("param1", sql.VarChar, value)
  .query("SELECT * FROM Table WHERE col = @param1");
```

## Design Notes
- Uses a singleton pool pattern — only one pool created per server instance.
- Supports both Windows Authentication (`msnodesqlv8`) and SQL Server Authentication.
- All route files import and use `getPool()` for database access.
