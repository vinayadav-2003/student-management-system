const express = require("express");
const cors = require("cors");
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

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Student Management System API running" });
});

const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, async () => {
  console.log(`API running on http://localhost:${PORT}`);
  await initDb();
});