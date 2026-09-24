# SERVER — `server/server.js`

## Purpose
Main Express server entry point. Configures middleware, mounts API routes, starts the HTTP server, and initializes the database pool.

## Dependencies
| Import | Usage |
|--------|-------|
| `express` | Web framework |
| `cors` | Cross-Origin Resource Sharing |
| `path` | Resolve paths |
| `dotenv` | Environment variable loading |
| `./db` | Database pool initialization |
| `./routes/auth` | Auth routes |
| `./routes/students` | Student routes |
| `./routes/users` | User management routes |
| `./routes/masters` | Master data routes |

## Middleware Setup
```js
app.use(cors());
app.use(express.json({ limit: "50mb" }));    // Large payload for Base64 photos
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
```

## Route Mounting
| Route Prefix | Router File | Description |
|-------------|-------------|-------------|
| `/` | `routes/auth.js` | Auth endpoints (login, verify-otp, forgot-password, change-password) |
| `/api` | `routes/students.js` | Student CRUD, approval, Excel import/export |
| `/api` | `routes/users.js` | User CRUD |
| `/api` | `routes/masters.js` | States, Cities, Courses CRUD + dashboard stats |
| `/api` | `routes/auth.js` | Forgot password and change password (under `/api` prefix) |

## Environment Variables (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server listening port |
| `JWT_SECRET` | — | Secret key for JWT signing |
| `DB_SERVER` | `localhost` | SQL Server host |
| `DB_DATABASE` | `School` | Database name |
| `DB_USER` | — | SQL auth username |
| `DB_PASSWORD` | — | SQL auth password |
| `EMAIL_HOST` | — | SMTP host |
| `EMAIL_PORT` | — | SMTP port |
| `EMAIL_USER` | — | SMTP email |
| `EMAIL_PASS` | — | SMTP password |

## Server Start
```js
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Design Notes
- JSON body limit is set to 50MB to accommodate Base64-encoded photos.
- The server does not call `dbInit.js` automatically — it must be run separately to initialize the schema.
- All routes use the `authenticate` middleware except login, verify-otp, and forgot-password.
- CORS is enabled globally (sufficient for Vite proxy development setup).
