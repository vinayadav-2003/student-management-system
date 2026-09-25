const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
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

// Serve the built React frontend (produced by `npm run build` at the repo
// root and copied into server/public during the Docker build).
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // SPA fallback: any request that isn't an API/auth route should return
  // index.html so client-side routing (react-router-dom) can take over.
  app.get(/^(?!\/api|\/login|\/verify-otp).*/, (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ status: "OK", message: "Student Management System API running" });
  });
}

const PORT = process.env.PORT || process.env.APP_PORT || 8080;
app.listen(PORT, async () => {
  console.log(`API running on http://localhost:${PORT}`);
  await initDb();
});