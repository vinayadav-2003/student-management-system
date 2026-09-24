const express = require("express");
const { sql, getPool } = require("../db");
const authenticate = require("../middleware/auth");

const router = express.Router();

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get("/api/dashboard/stats", authenticate, async (req, res) => {
  try {
    const pool = await getPool();

    const [studentsRes, statesRes, citiesRes, coursesRes, statusRes, courseRes, recentRes] =
      await Promise.all([
        pool.request().query("SELECT COUNT(*) AS count FROM Students"),
        pool.request().query("SELECT COUNT(*) AS count FROM States"),
        pool.request().query("SELECT COUNT(*) AS count FROM Cities"),
        pool.request().query("SELECT COUNT(*) AS count FROM Courses"),
        pool.request().query(`
          SELECT
            COALESCE(NULLIF(latest_request_status,''), 'Pending') AS status,
            COUNT(*) AS count
          FROM Students
          GROUP BY COALESCE(NULLIF(latest_request_status,''), 'Pending')
        `),
        pool.request().query(`
          SELECT TOP 6 course, COUNT(*) AS count
          FROM Students
          WHERE course IS NOT NULL AND course != ''
          GROUP BY course
          ORDER BY count DESC
        `),
        pool.request().query(`
          SELECT TOP 5 id, name, email, course, state, city, created_at, createdDate, latest_request_status
          FROM Students
          ORDER BY id DESC
        `),
      ]);

    res.json({
      students:       studentsRes.recordset[0].count,
      states:         statesRes.recordset[0].count,
      cities:         citiesRes.recordset[0].count,
      courses:        coursesRes.recordset[0].count,
      byStatus:       statusRes.recordset,
      byCourse:       courseRes.recordset,
      recentStudents: recentRes.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// States
router.get("/api/states", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT * FROM States ORDER BY name ASC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/states", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "State name is required" });
    }
    const pool = await getPool();

    const check = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .query("SELECT id FROM States WHERE LOWER(name) = LOWER(@name)");
    if (check.recordset.length > 0) {
      return res.status(400).json({ error: "State already exists" });
    }

    const result = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .query("INSERT INTO States (name) OUTPUT INSERTED.* VALUES (@name)");
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/states/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "State name is required" });
    }
    const pool = await getPool();

    const check = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("id", sql.Int, req.params.id)
      .query(
        "SELECT id FROM States WHERE LOWER(name) = LOWER(@name) AND id != @id",
      );
    if (check.recordset.length > 0) {
      return res.status(400).json({ error: "State already exists" });
    }

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("name", sql.NVarChar, name.trim())
      .query("UPDATE States SET name=@name OUTPUT INSERTED.* WHERE id=@id");
    if (!result.recordset[0])
      return res.status(404).json({ error: "State not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/states/:id", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM States OUTPUT DELETED.* WHERE id=@id");
    if (!result.recordset[0])
      return res.status(404).json({ error: "State not found" });
    res.json({ message: "Deleted", state: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cities
router.get("/api/cities", async (req, res) => {
  const stateId = req.query.stateId || "";
  try {
    const pool = await getPool();
    let query =
      "SELECT Cities.*, States.name AS stateName FROM Cities LEFT JOIN States ON Cities.stateId = States.id ";
    const request = pool.request();
    if (stateId) {
      request.input("stateId", sql.Int, stateId);
      query += "WHERE Cities.stateId = @stateId ";
    }
    query += "ORDER BY Cities.name ASC";
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/cities", async (req, res) => {
  try {
    const { name, stateId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "City name is required" });
    }
    if (!stateId) {
      return res.status(400).json({ error: "State ID is required" });
    }
    const pool = await getPool();

    const check = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("stateId", sql.Int, stateId)
      .query(
        "SELECT id FROM Cities WHERE LOWER(name) = LOWER(@name) AND stateId = @stateId",
      );
    if (check.recordset.length > 0) {
      return res
        .status(400)
        .json({ error: "City already exists in this state" });
    }

    const result = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("stateId", sql.Int, stateId)
      .query(
        "INSERT INTO Cities (name, stateId) OUTPUT INSERTED.* VALUES (@name, @stateId)",
      );
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/cities/:id", async (req, res) => {
  try {
    const { name, stateId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "City name is required" });
    }
    if (!stateId) {
      return res.status(400).json({ error: "State ID is required" });
    }
    const pool = await getPool();

    const check = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("stateId", sql.Int, stateId)
      .input("id", sql.Int, req.params.id)
      .query(
        "SELECT id FROM Cities WHERE LOWER(name) = LOWER(@name) AND stateId = @stateId AND id != @id",
      );
    if (check.recordset.length > 0) {
      return res
        .status(400)
        .json({ error: "City already exists in this state" });
    }

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("name", sql.NVarChar, name.trim())
      .input("stateId", sql.Int, stateId)
      .query(
        "UPDATE Cities SET name=@name, stateId=@stateId OUTPUT INSERTED.* WHERE id=@id",
      );
    if (!result.recordset[0])
      return res.status(404).json({ error: "City not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/cities/:id", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Cities OUTPUT DELETED.* WHERE id=@id");
    if (!result.recordset[0])
      return res.status(404).json({ error: "City not found" });
    res.json({ message: "Deleted", city: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Courses
router.get("/api/courses", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT * FROM Courses ORDER BY name ASC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/courses", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Course name is required" });
    }
    const pool = await getPool();

    const check = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .query("SELECT id FROM Courses WHERE LOWER(name) = LOWER(@name)");
    if (check.recordset.length > 0) {
      return res.status(400).json({ error: "Course already exists" });
    }

    const result = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .query("INSERT INTO Courses (name) OUTPUT INSERTED.* VALUES (@name)");
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/courses/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Course name is required" });
    }
    const pool = await getPool();

    const check = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("id", sql.Int, req.params.id)
      .query(
        "SELECT id FROM Courses WHERE LOWER(name) = LOWER(@name) AND id != @id",
      );
    if (check.recordset.length > 0) {
      return res.status(400).json({ error: "Course already exists" });
    }

    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("name", sql.NVarChar, name.trim())
      .query("UPDATE Courses SET name=@name OUTPUT INSERTED.* WHERE id=@id");
    if (!result.recordset[0])
      return res.status(404).json({ error: "Course not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/courses/:id", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Courses OUTPUT DELETED.* WHERE id=@id");
    if (!result.recordset[0])
      return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Deleted", course: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
