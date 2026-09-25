const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
require("dotenv").config();

const { initDb } = require("./dbInit");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const userRoutes = require("./routes/users");
const masterRoutes = require("./routes/masters");

const app = express();
app.use(cors());
app.use(express.json());

// Register modular routes
app.use(authRoutes);
app.use(studentRoutes);
app.use(userRoutes);
app.use(masterRoutes);

// Detect client build directory (server/public for Docker, ../dist or ./dist for local/standard builds)
const clientBuildPath = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public")
  : fs.existsSync(path.join(__dirname, "../dist"))
  ? path.join(__dirname, "../dist")
  : fs.existsSync(path.join(__dirname, "dist"))
  ? path.join(__dirname, "dist")
  : null;

if (clientBuildPath) {
  // Serve static assets from the React build
  app.use(express.static(clientBuildPath));

  // SPA fallback: any request that isn't an API/auth route should return index.html
  app.get(/^(?!\/api|\/login|\/verify-otp).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ status: "OK", message: "Student Management System API running" });
  });
}

const PORT = process.env.PORT || process.env.APP_PORT || 8080;
app.listen(PORT, async () => {
  console.log(`API running on http://localhost:${PORT}`);
  try {
    await initDb();
  } catch (err) {
    console.warn("Database initialization notice:", err.message);
  }
});