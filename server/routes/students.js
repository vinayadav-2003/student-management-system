const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { sql, getPool } = require("../db");
const authenticate = require("../middleware/auth");
const { sendEmail } = require("../services/mailService");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });




const getVal = (row, keys) => {
  for (const k of keys) {
    const foundKey = Object.keys(row).find(
      (rk) => rk.toLowerCase().trim() === k.toLowerCase().trim(),
    );
    if (foundKey !== undefined) return row[foundKey];
  }
  return null;
};

async function getApproverForLevel(pool, level) {
  const result = await pool
    .request()
    .input("level", sql.Int, level)
    .query(
      "SELECT TOP 1 user_id FROM matrix WHERE level = @level ORDER BY id ASC",
    );
  return result.recordset.length > 0 ? result.recordset[0].user_id : null;
}

// Routes
router.get("/api/export/students/excel", authenticate, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .query(
        "SELECT name AS Name, email AS Email, course AS Course, state AS State, city AS City, mobile AS Mobile, age AS Age FROM Students ORDER BY id DESC",
      );

    const worksheet = XLSX.utils.json_to_sheet(result.recordset);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/api/upload/students/excel/preview",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const students = XLSX.utils.sheet_to_json(sheet);
      const pool = await getPool();

      const statesDb = (await pool.request().query("SELECT * FROM States"))
        .recordset;
      const citiesDb = (await pool.request().query("SELECT * FROM Cities"))
        .recordset;
      const coursesDb = (await pool.request().query("SELECT * FROM Courses"))
        .recordset;

      const excelData = [];
      for (const s of students) {
        console.log("Parsed Excel row:", s);
        let email = s.Email || getVal(s, ["email"]);
        let name = s.Name || getVal(s, ["name"]);
        let course = s.Course || getVal(s, ["course"]);
        let state = s.State || getVal(s, ["state"]);
        let city = s.City || getVal(s, ["city"]);
        let age = s.Age !== undefined ? s.Age : getVal(s, ["age"]);
        let mobile = s.Mobile || getVal(s, ["mobile"]);

        email = email ? email.toString().trim() : "";
        name = name ? name.toString().trim() : "";
        course = course ? course.toString().trim() : "";
        state = state ? state.toString().trim() : "";
        city = city ? city.toString().trim() : "";
        mobile = mobile ? mobile.toString().trim() : "";

        if (state) {
          const matchedState = statesDb.find(
            (st) => st.name.toLowerCase() === state.toLowerCase(),
          );
          if (matchedState) {
            state = matchedState.name;

            if (city) {
              const matchedCity = citiesDb.find(
                (ci) =>
                  ci.stateId === matchedState.id &&
                  ci.name.toLowerCase() === city.toLowerCase(),
              );
              if (matchedCity) {
                city = matchedCity.name;
              }
            }
          }
        }

        if (course) {
          const matchedCourse = coursesDb.find(
            (co) => co.name.toLowerCase() === course.toLowerCase(),
          );
          if (matchedCourse) {
            course = matchedCourse.name;
          }
        }

        const studentData = {
          Name: name,
          Email: email,
          Course: course,
          State: state,
          City: city,
          Age: age,
          Mobile: mobile,
        };

        if (!email) {
          excelData.push({
            ...studentData,
            status: "Missing Email",
          });
          continue;
        }

        const check = await pool
          .request()
          .input("email", sql.NVarChar, email)
          .query("SELECT * FROM Students WHERE email=@email");

        if (check.recordset.length > 0) {
          excelData.push({
            ...studentData,
            status: "Duplicate",
          });
        } else {
          excelData.push({
            ...studentData,
            status: "Ready",
          });
        }
      }

      res.json({
        total: students.length,
        excelData,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },
);

router.post(
  "/api/upload/students/excel/import",
  authenticate,
  async (req, res) => {
    try {
      const { students } = req.body;
      if (!students || !Array.isArray(students)) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      const pool = await getPool();
      const statesDb = (await pool.request().query("SELECT * FROM States"))
        .recordset;
      const citiesDb = (await pool.request().query("SELECT * FROM Cities"))
        .recordset;
      const coursesDb = (await pool.request().query("SELECT * FROM Courses"))
        .recordset;

      let imported = 0;
      let skipped = 0;
      const excelData = [];

      for (const s of students) {
        let email = (s.Email || s.email || getVal(s, ["email"]) || "")
          .toString()
          .trim();
        let name = (s.Name || s.name || getVal(s, ["name"]) || "")
          .toString()
          .trim();
        let course = (s.Course || s.course || getVal(s, ["course"]) || "")
          .toString()
          .trim();
        let state = (s.State || s.state || getVal(s, ["state"]) || "")
          .toString()
          .trim();
        let city = (s.City || s.city || getVal(s, ["city"]) || "")
          .toString()
          .trim();
        let age = s.Age !== undefined ? s.Age : getVal(s, ["age"]);
        let mobile = (s.Mobile || s.mobile || getVal(s, ["mobile"]) || "")
          .toString()
          .trim();

        if (state) {
          const matchedState = statesDb.find(
            (st) => st.name.toLowerCase() === state.toLowerCase(),
          );
          if (matchedState) {
            state = matchedState.name;

            if (city) {
              const matchedCity = citiesDb.find(
                (ci) =>
                  ci.stateId === matchedState.id &&
                  ci.name.toLowerCase() === city.toLowerCase(),
              );
              if (matchedCity) {
                city = matchedCity.name;
              }
            }
          }
        }

        if (course) {
          const matchedCourse = coursesDb.find(
            (co) => co.name.toLowerCase() === course.toLowerCase(),
          );
          if (matchedCourse) {
            course = matchedCourse.name;
          }
        }

        if (!email) {
          skipped++;
          excelData.push({
            ...s,
            status: "Missing Email",
          });
          continue;
        }

        const check = await pool
          .request()
          .input("email", sql.NVarChar, email)
          .query("SELECT * FROM Students WHERE email=@email");

        if (check.recordset.length > 0) {
          skipped++;
          excelData.push({
            ...s,
            status: "Duplicate",
          });
          continue;
        } else {
          const insertResult = await pool
            .request()
            .input("name", sql.NVarChar, name || null)
            .input("email", sql.NVarChar, email)
            .input("course", sql.NVarChar, course || null)
            .input("state", sql.NVarChar, state || null)
            .input("city", sql.NVarChar, city || null)
            .input("age", sql.Int, age ? parseInt(age, 10) : null)
            .input("mobile", sql.NVarChar, mobile || null)
            .input("createdBy", sql.Int, req.user ? req.user.id : null)
            .input("createdDate", sql.DateTime, new Date()).query(`
            INSERT INTO Students
            (name,email,course,state,city,age,mobile,createdBy,createdDate)
            OUTPUT INSERTED.*
            VALUES
            (@name,@email,@course,@state,@city,@age,@mobile,@createdBy,@createdDate)
          `);

          const newStudent = insertResult.recordset[0];

          // Initialize approval flow
          try {
            const level1ApproverId = await getApproverForLevel(pool, 1);
            const level2ApproverId = await getApproverForLevel(pool, 2);

            const startLevel =
              level1ApproverId !== null ? 1 : level2ApproverId !== null ? 2 : null;
            const startApproverId =
              level1ApproverId !== null ? level1ApproverId : level2ApproverId;

            if (startLevel !== null) {
              const desiredResult = await pool
                .request()
                .input("student_id", sql.Int, newStudent.id)
                .input("level", sql.Int, startLevel)
                .input("user_id", sql.Int, startApproverId).query(`
                 INSERT INTO student_desired (student_id, level, user_id)
                 OUTPUT INSERTED.*
                 VALUES (@student_id, @level, @user_id)
               `);

              const desired = desiredResult.recordset[0];

              await pool
                .request()
                .input("student_id", sql.Int, newStudent.id)
                .input("student_desired_id", sql.Int, desired.id)
                .input("user_id", sql.Int, startApproverId)
                .input("level", sql.Int, startLevel).query(`
                   INSERT INTO student_flow (student_id, student_desired_id, user_id, level, decision, status)
                   VALUES (@student_id, @student_desired_id, @user_id, @level, NULL, 'N')
                 `);

              const approverResult = await pool
                .request()
                .input("approverId", sql.Int, startApproverId)
                .query("SELECT Name, Email FROM Users WHERE Id = @approverId");

              const approver = approverResult.recordset[0];
              if (approver && approver.Email) {
                try {
                  await sendEmail({
                    type: "PENDING",
                    to: approver.Email.trim(),
                    student: newStudent,
                    user: approver,
                    level: `Level ${startLevel}`,
                  });
                } catch (err) {
                  console.error("Pending email error on excel import:", err);
                }
              }
            }
          } catch (flowErr) {
            console.error("Failed to create student_desired/student_flow entry during import:", flowErr);
          }

          imported++;
          excelData.push({
            ...s,
            status: "Imported",
          });
        }
      }

      res.json({
        imported,
        skipped,
        total: students.length,
        excelData,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },
);

router.post(
  "/api/students",
  authenticate,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { name, email, course, state, city, age, mobile, location, latlong } = req.body;
      const pool = await getPool();

      let photoBase64 = null;
      if (req.file) {
        photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }

      const countResult = await pool
        .request()
        .query("SELECT COUNT(*) AS total FROM Students");

      const total = countResult.recordset[0].total + 1;
      const studentId = `STU${String(total).padStart(3, "0")}`;

      const duplicateCheck = await pool
        .request()
        .input("check_name", sql.NVarChar, name)
        .input("check_email", sql.NVarChar, email)
        .input("check_course", sql.NVarChar, course)
        .input("check_state", sql.NVarChar, state)
        .input("check_city", sql.NVarChar, city)
        .input("check_age", sql.Int, age)
        .input("check_mobile", sql.NVarChar, mobile).query(`
        SELECT id FROM Students 
        WHERE 
          LOWER(name) = LOWER(@check_name) AND
          LOWER(email) = LOWER(@check_email) AND
          LOWER(course) = LOWER(@check_course) AND
          LOWER(state) = LOWER(@check_state) AND
          LOWER(city) = LOWER(@check_city) AND
          age = @check_age AND
          mobile = @check_mobile
      `);

      if (duplicateCheck.recordset.length > 0) {
        return res
          .status(400)
          .json({ error: "Student exactly like this is already registered" });
      }

      const result = await pool
        .request()
        .input("student_id", sql.NVarChar, studentId)
        .input("name", sql.NVarChar, name)
        .input("email", sql.NVarChar, email)
        .input("course", sql.NVarChar, course)
        .input("state", sql.NVarChar, state)
        .input("city", sql.NVarChar, city)
        .input("age", sql.Int, age)
        .input("mobile", sql.NVarChar, mobile)
        .input("photo", sql.NVarChar, photoBase64)
        .input("location", sql.NVarChar, location || null)
        .input("latlong", sql.NVarChar, latlong || null)
        .input("createdBy", sql.Int, req.user ? req.user.id : null)
        .input("createdDate", sql.DateTime, new Date()).query(`
        INSERT INTO Students
        (student_id, name, email, course, state, city, age, mobile, photo, createdBy, location, latlong, createdDate)
        OUTPUT INSERTED.*
        VALUES
        (@student_id, @name, @email, @course, @state, @city, @age, @mobile, @photo, @createdBy, @location, @latlong, GETUTCDATE())
      `);

      const student = result.recordset[0];
      

      // approval flow assignment, null-approver safe
      try {
        const level1ApproverId = await getApproverForLevel(pool, 1);
        const level2ApproverId = await getApproverForLevel(pool, 2);

        const startLevel =
          level1ApproverId !== null ? 1 : level2ApproverId !== null ? 2 : null;
        const startApproverId =
          level1ApproverId !== null ? level1ApproverId : level2ApproverId;

        if (startLevel !== null) {
          const desiredResult = await pool
            .request()
            .input("student_id", sql.Int, student.id)
            .input("level", sql.Int, startLevel)
            .input("user_id", sql.Int, startApproverId).query(`
            INSERT INTO student_desired (student_id, level, user_id)
            OUTPUT INSERTED.*
            VALUES (@student_id, @level, @user_id)
          `);

          const desired = desiredResult.recordset[0];

          await pool
            .request()
            .input("student_id", sql.Int, student.id)
            .input("student_desired_id", sql.Int, desired.id)
            .input("user_id", sql.Int, startApproverId)
            .input("level", sql.Int, startLevel).query(`
              INSERT INTO student_flow (student_id, student_desired_id, user_id, level, decision, status)
              VALUES (@student_id, @student_desired_id, @user_id, @level, NULL, 'N')
            `);

          const approverResult = await pool
            .request()
            .input("approverId", sql.Int, startApproverId)
            .query("SELECT Name, Email FROM Users WHERE Id = @approverId");

          const approver = approverResult.recordset[0];
          if (approver && approver.Email) {
            try {
              await sendEmail({
                type: "PENDING",
                to: approver.Email.trim(),
                student,
                user: approver,
                level: `Level ${startLevel}`,
              });
            } catch (err) {
              console.error("Pending email error on student creation:", err);
            }
          }
        } else {
          console.error(
            "No approver (Teacher/Headmaster) found in matrix table — skipping approval flow creation.",
          );
        }
      } catch (flowErr) {
        console.error(
          "Failed to create student_desired/student_flow entry:",
          flowErr,
        );
      }

      let emailSent = false;
      let emailError = null;
      if (student.email) {
        try {
          await sendEmail({ type: "WELCOME", to: student.email, student });
          emailSent = true;
        } catch (err) {
          emailError = err.message;
          console.error("Email error:", err);
        }
      }

      res.status(201).json({ ...student, emailSent, emailError });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.get("/api/studentsCount", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT COUNT(*) AS total FROM Students");
    res.json({ count: result.recordset[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aggregates for pie charts (by State, City, Course)
router.get("/api/students/aggregates", authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const [statesRes, citiesRes, coursesRes] = await Promise.all([
      pool.request().query(`
        SELECT state AS label, COUNT(*) AS value
        FROM Students
        WHERE state IS NOT NULL AND state != ''
        GROUP BY state ORDER BY value DESC
      `),
      pool.request().query(`
        SELECT city AS label, COUNT(*) AS value
        FROM Students
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city ORDER BY value DESC
      `),
      pool.request().query(`
        SELECT course AS label, COUNT(*) AS value
        FROM Students
        WHERE course IS NOT NULL AND course != ''
        GROUP BY course ORDER BY value DESC
      `),
    ]);

    res.json({
      states:  statesRes.recordset,
      cities:  citiesRes.recordset,
      courses: coursesRes.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get("/api/students/check-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ exists: false });
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email.trim())
      .query("SELECT id FROM Students WHERE LOWER(email) = LOWER(@email)");
    res.json({ exists: result.recordset.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/students", authenticate, async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search || "";
  const state = req.query.state || "";
  const city = req.query.city || "";
  const course = req.query.course || "";

  const skip = (page - 1) * limit;

  try {
    const pool = await getPool();
    let whereClauses = [];

    const request = pool
      .request()
      .input("skip", sql.Int, skip)
      .input("limit", sql.Int, limit);

    if (search.trim() !== "") {
      request.input("search", sql.NVarChar, `%${search.trim()}%`);
      whereClauses.push(
        `(CAST(id AS NVARCHAR(20)) LIKE @search OR name LIKE @search OR email LIKE @search OR course LIKE @search OR state LIKE @search OR city LIKE @search OR mobile LIKE @search)`,
      );
    }

    if (state.trim() !== "") {
      request.input("state", sql.NVarChar, state);
      whereClauses.push(`state = @state`);
    }

    if (city.trim() !== "") {
      request.input("city", sql.NVarChar, city);
      whereClauses.push(`city = @city`);
    }

    if (course.trim() !== "") {
      request.input("course", sql.NVarChar, course);
      whereClauses.push(`course = @course`);
    }

    let whereSql = "";
    if (whereClauses.length > 0) {
      whereSql = "WHERE " + whereClauses.join(" AND ");
    }

    const studentsQuery = `
     SELECT
          Students.*,
          CASE
              WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND (lastClosed.closed_decision = 'Forward' OR lastClosed.closed_decision IS NULL) THEN 'Forwarded'
              WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND lastClosed.closed_decision = 'Returned' THEN 'Returned'
              WHEN sf.status = 'N' THEN 'Pending'
              ELSE COALESCE(sf.decision, 'Pending')
          END AS latest_request_status,
          sf.remarks,
          sf.level
      FROM Students
      OUTER APPLY (
          SELECT TOP 1
              student_flow.decision,
              student_flow.remarks,
              student_flow.level,
              student_flow.status
          FROM student_desired
          LEFT JOIN student_flow
              ON student_flow.student_desired_id = student_desired.id
          WHERE student_desired.student_id = Students.id
          ORDER BY student_flow.id DESC
      ) AS sf
      OUTER APPLY (
          SELECT TOP 1
              student_flow2.id AS closed_id,
              student_flow2.decision AS closed_decision
          FROM student_desired sd2
          JOIN student_flow student_flow2
              ON student_flow2.student_desired_id = sd2.id
          WHERE sd2.student_id = Students.id
            AND student_flow2.status = 'Y'
          ORDER BY student_flow2.id DESC
      ) AS lastClosed
      ${whereSql}
      ORDER BY Students.id DESC
      OFFSET @skip ROWS
      FETCH NEXT @limit ROWS ONLY;
    `;

    const countQuery = `
      SELECT COUNT(*) total
      FROM Students
      ${whereSql}
    `;

    const students = await request.query(studentsQuery);

    const countRequest = pool.request();
    if (search.trim() !== "")
      countRequest.input("search", sql.NVarChar, `%${search.trim()}%`);
    if (state.trim() !== "") countRequest.input("state", sql.NVarChar, state);
    if (city.trim() !== "") countRequest.input("city", sql.NVarChar, city);
    if (course.trim() !== "")
      countRequest.input("course", sql.NVarChar, course);

    const total = await countRequest.query(countQuery);

    res.json({
      students: students.recordset,
      total: total.recordset[0].total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get("/api/students/:id", authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("id", sql.Int, req.params.id)
      .query(`
       SELECT
    Students.*,
    CreatedByUser.Name AS createdByName,
    CASE
        WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND (lastClosed.closed_decision = 'Forward' OR lastClosed.closed_decision IS NULL) THEN 'Forwarded'
        WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND lastClosed.closed_decision = 'Returned' THEN 'Returned'
        WHEN sf.status = 'N' THEN 'Pending'
        ELSE COALESCE(sf.decision, 'Pending')
    END AS latest_request_status,
    sf.remarks,
    sf.level AS pending_level,
    sf.desired_user_id AS pending_user_id,
    sf.user_id AS pending_assigned_user_id,

    (
        SELECT U.Name
        FROM Users U
        WHERE U.Id = COALESCE(sf.user_id, sf.desired_user_id)
    ) AS pendingWithName,

    CASE
        WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND (lastClosed.closed_decision = 'Forward' OR lastClosed.closed_decision IS NULL) THEN 'Forwarded'
        ELSE decided.decision
    END AS decision,
    CASE
        WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND (lastClosed.closed_decision = 'Forward' OR lastClosed.closed_decision IS NULL) THEN lastClosed.closed_remarks
        ELSE decided.remarks
    END AS decisionRemarks,
    CASE
        WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND (lastClosed.closed_decision = 'Forward' OR lastClosed.closed_decision IS NULL) THEN lastClosed.closed_updated_at
        ELSE decided.decision_datetime
    END AS decisionDate,
    CASE
        WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND (lastClosed.closed_decision = 'Forward' OR lastClosed.closed_decision IS NULL) THEN lastClosed.closed_updated_at
        ELSE decided.updated_at
    END AS decisionUpdatedAt,
    CASE
        WHEN sf.status = 'N' AND lastClosed.closed_id IS NOT NULL AND (lastClosed.closed_decision = 'Forward' OR lastClosed.closed_decision IS NULL) THEN ForwardedByUser.Name
        ELSE DecidedByUser.Name
    END AS decisionByName

FROM Students

LEFT JOIN Users AS CreatedByUser
ON CreatedByUser.Id = Students.createdBy

OUTER APPLY
(
    SELECT TOP 1
        student_flow.decision,
        student_flow.remarks,
        student_flow.level,
        student_flow.user_id,
        student_flow.status,
        student_desired.user_id AS desired_user_id
    FROM student_desired
    LEFT JOIN student_flow
        ON student_flow.student_desired_id = student_desired.id
    WHERE student_desired.student_id = Students.id
    ORDER BY student_flow.id DESC
) AS sf

OUTER APPLY
(
    SELECT TOP 1
        student_flow3.id AS closed_id,
        student_flow3.decision AS closed_decision,
        student_flow3.remarks AS closed_remarks,
        student_flow3.updated_at AS closed_updated_at,
        student_flow3.updated_by AS closed_updated_by
    FROM student_desired sd3
    JOIN student_flow student_flow3
        ON student_flow3.student_desired_id = sd3.id
    WHERE sd3.student_id = Students.id
      AND student_flow3.status = 'Y'
    ORDER BY student_flow3.id DESC
) AS lastClosed

OUTER APPLY
(
    SELECT TOP 1
        sf2.decision,
        sf2.remarks,
        sf2.decision_datetime,
        sf2.updated_at,
        sf2.updated_by
    FROM student_desired sd2
    JOIN student_flow sf2 ON sf2.student_desired_id = sd2.id
    WHERE sd2.student_id = Students.id
      AND sf2.decision IS NOT NULL
    ORDER BY sf2.id DESC
) AS decided

LEFT JOIN Users AS DecidedByUser
ON DecidedByUser.Id = decided.updated_by

LEFT JOIN Users AS ForwardedByUser
ON ForwardedByUser.Id = lastClosed.closed_updated_by

WHERE Students.id = @id;
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = result.recordset[0];
    const isPending =
      student.latest_request_status === "Pending" ||
      student.latest_request_status === "Forwarded" ||
      student.latest_request_status === "Returned";

    let canApprove = 0;
    if (isPending && student.pending_assigned_user_id) {
      canApprove =
        Number(student.pending_assigned_user_id) === Number(req.user.id)
          ? 1
          : 0;
    }
    student.canApprove = canApprove;

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

///histry
router.get("/api/students/:id/approval-history", authenticate, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request()
      .input("studentId", sql.Int, req.params.id)
      .query(`
        SELECT
          sf.id,
          sf.level,
          sf.decision,
          sf.remarks,
          sf.decision_datetime,
          sf.status,
          u.Name AS decisionByName
        FROM student_flow sf
        LEFT JOIN Users u
          ON u.Id = sf.updated_by
        WHERE sf.student_id = @studentId
        ORDER BY sf.id ASC
      `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/students/:id/approval", authenticate, async (req, res) => {
  const studentId = req.params.id;
  const { decision, remarks, forwardUserId } = req.body; // 'Approved' | 'Rejected' | 'Returned' | 'Forward'
  const approverId = req.user.id;

  if (!["Approved", "Rejected", "Returned", "Forward"].includes(decision)) {
    return res.status(400).json({ error: "Invalid decision" });
  }

  if (decision === "Forward" && !forwardUserId) {
    return res.status(400).json({ error: "forwardUserId is required to forward" });
  }

  try {
    const pool = await getPool();

    const studentResult = await pool
      .request()
      .input("id", sql.Int, studentId)
      .query(`
        SELECT id, name, email
        FROM Students
        WHERE id = @id
      `);
    const student = studentResult.recordset[0];

    const flowRes = await pool.request().input("studentId", sql.Int, studentId)
      .query(`
        SELECT TOP 1 sf.*
        FROM student_desired sd
        JOIN student_flow sf ON sf.student_desired_id = sd.id
        WHERE sd.student_id = @studentId
          AND sf.decision IS NULL
          AND sf.status = 'N'
        ORDER BY sf.id DESC
      `);

    if (flowRes.recordset.length === 0) {
      return res.status(400).json({ error: "No pending approval found" });
    }
    const flow = flowRes.recordset[0];

    if (Number(flow.user_id) !== Number(approverId)) {
      return res
        .status(403)
        .json({ error: "You are not the assigned approver for this request" });
    }

    if (decision === "Forward") {
      const targetUser = await pool
        .request()
        .input("id", sql.Int, forwardUserId)
        .query(`
        SELECT Id, Name, Email
        FROM Users
        WHERE Id = @id
      `);

      if (targetUser.recordset.length === 0) {
        return res.status(400).json({ error: "Forward target user not found" });
      }

      await pool
        .request()
        .input("id", sql.Int, flow.id)
        .input("decision", sql.NVarChar, decision)
        .input("remarks", sql.NVarChar, remarks || null)
        .input("updatedBy", sql.Int, approverId).query(`
          UPDATE student_flow
          SET decision=@decision, status='Y', remarks=@remarks, updated_by=@updatedBy, updated_at=GETUTCDATE()
          WHERE id=@id
        `);

      await pool
        .request()
        .input("desiredId", sql.Int, flow.student_desired_id)
        .input("level", sql.Int, flow.level)
        .input("userId", sql.Int, forwardUserId).query(`
          UPDATE student_desired
          SET level = @level, user_id = @userId
          WHERE id = @desiredId
        `);

      await pool
        .request()
        .input("studentId", sql.Int, flow.student_id)
        .input("desiredId", sql.Int, flow.student_desired_id)
        .input("userId", sql.Int, forwardUserId)
        .input("level", sql.Int, flow.level).query(`
          INSERT INTO student_flow (student_id, student_desired_id, user_id, level, decision, status)
          VALUES (@studentId, @desiredId, @userId, @level, NULL, 'N')
        `);

      const forwardUser = targetUser.recordset[0];

      if (forwardUser && forwardUser.Email) {
        try {
          await sendEmail({
            type: "FORWARDED",
            to: forwardUser.Email,
            student,
            user: forwardUser,
            level: `Level ${flow.level}`,
            remarks,
          });
        } catch (err) {
          console.error("Forward email error:", err);
        }
      }

      return res.json({ success: true, finalStatus: "Forwarded" });
    }

    await pool
      .request()
      .input("id", sql.Int, flow.id)
      .input("decision", sql.NVarChar, decision)
      .input("remarks", sql.NVarChar, remarks || null)
      .input("updatedBy", sql.Int, approverId).query(`
        UPDATE student_flow
        SET decision=@decision, remarks=@remarks, decision_datetime=GETUTCDATE(),
            status='Y', updated_by=@updatedBy, updated_at=GETUTCDATE()
        WHERE id=@id
      `);

    if (decision === "Approved" && student && student.email) {
      try {
        await sendEmail({
          type: "APPROVED",
          to: student.email,
          student,
          level: `Level ${flow.level}`,
          remarks,
        });
      } catch (err) {
        console.error("Approval email error:", err);
      }
    }

    if (decision === "Rejected") {
      if (student && student.email) {
        try {
          await sendEmail({
            type: "REJECTED",
            to: student.email,
            student,
            level: `Level ${flow.level}`,
            remarks,
          });
        } catch (err) {
          console.error("Rejection email error:", err);
        }
      }

      return res.json({
        success: true,
        finalStatus: "Rejected",
      });
    }

    if (decision === "Returned") {
      const level1ApproverId = await getApproverForLevel(pool, 1);
      const restartLevel = level1ApproverId !== null ? 1 : flow.level;
      const restartApproverId = level1ApproverId !== null ? level1ApproverId : flow.user_id;

      const userResult = await pool
        .request()
        .input("id", sql.Int, restartApproverId)
        .query(`
          SELECT Name, Email
          FROM Users
          WHERE Id = @id
        `);

      const returnUser = userResult.recordset[0];
      if (returnUser && returnUser.Email) {
        try {
          await sendEmail({
            type: "RETURNED",
            to: returnUser.Email,
            student,
            user: returnUser,
            level: `Level ${restartLevel}`,
            remarks,
          });
        } catch (err) {
          console.error("Return email error:", err);
        }
      }

      await pool
        .request()
        .input("desiredId", sql.Int, flow.student_desired_id)
        .input("level", sql.Int, restartLevel)
        .input("userId", sql.Int, restartApproverId).query(`
          UPDATE student_desired
          SET level = @level, user_id = @userId
          WHERE id = @desiredId
        `);

      await pool
        .request()
        .input("studentId", sql.Int, flow.student_id)
        .input("desiredId", sql.Int, flow.student_desired_id)
        .input("userId", sql.Int, restartApproverId)
        .input("level", sql.Int, restartLevel).query(`
          INSERT INTO student_flow (student_id, student_desired_id, user_id, level, decision, status)
          VALUES (@studentId, @desiredId, @userId, @level, NULL, 'N')
        `);
      return res.json({ success: true, finalStatus: "Returned" });
    }

    // decision === "Approved"
    const nextLevel = flow.level + 1;
    const nextApprover = await pool
      .request()
      .input("level", sql.Int, nextLevel)
      .query(
        "SELECT TOP 1 user_id FROM matrix WHERE level=@level ORDER BY id ASC",
      );

    if (nextApprover.recordset.length > 0) {
      const nextApproverId = nextApprover.recordset[0].user_id;

      const afterNextApproverId = await getApproverForLevel(pool, nextLevel + 1);
      const desiredUserId =
        afterNextApproverId !== null ? afterNextApproverId : nextApproverId;

      await pool
        .request()
        .input("desiredId", sql.Int, flow.student_desired_id)
        .input("level", sql.Int, nextLevel)
        .input("userId", sql.Int, desiredUserId).query(`
          UPDATE student_desired
          SET level = @level, user_id = @userId
          WHERE id = @desiredId
        `);

      await pool
        .request()
        .input("studentId", sql.Int, flow.student_id)
        .input("desiredId", sql.Int, flow.student_desired_id)
        .input("userId", sql.Int, nextApproverId)
        .input("level", sql.Int, nextLevel).query(`
          INSERT INTO student_flow (student_id, student_desired_id, user_id, level, decision, status)
          VALUES (@studentId, @desiredId, @userId, @level, NULL, 'N')
        `);


      return res.json({ success: true, message: "Moved to next level" });
    }

    res.json({ success: true, finalStatus: "Approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(
  "/api/students/:id",
  authenticate,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { name, email, course, state, city, age, mobile, location , latlong } = req.body;
      const pool = await getPool();

      let photoBase64 = null;
      if (req.file) {
        photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }

      const duplicateCheck = await pool
        .request()
        .input("id", sql.Int, req.params.id)
        .input("check_name", sql.NVarChar, name)
        .input("check_email", sql.NVarChar, email)
        .input("check_course", sql.NVarChar, course)
        .input("check_state", sql.NVarChar, state)
        .input("check_city", sql.NVarChar, city)
        .input("check_age", sql.Int, age)
        .input("check_mobile", sql.NVarChar, mobile).query(`
        SELECT id FROM Students 
        WHERE 
          LOWER(name) = LOWER(@check_name) AND
          LOWER(email) = LOWER(@check_email) AND
          LOWER(course) = LOWER(@check_course) AND
          LOWER(state) = LOWER(@check_state) AND
          LOWER(city) = LOWER(@check_city) AND
          age = @check_age AND
          mobile = @check_mobile AND
          id != @id
      `);

      if (duplicateCheck.recordset.length > 0) {
        return res
          .status(400)
          .json({ error: "Student exactly like this is already registered" });
      }

      const request = pool.request();
      request
        .input("id", sql.Int, req.params.id)
        .input("name", sql.NVarChar, name)
        .input("email", sql.NVarChar, email)
        .input("course", sql.NVarChar, course)
        .input("state", sql.NVarChar, state)
        .input("city", sql.NVarChar, city)
        .input("age", sql.Int, age)
        .input("mobile", sql.NVarChar, mobile)
        .input("location", sql.NVarChar, location || null)
        .input("latlong", sql.NVarChar, latlong || null);

      let queryStr = "";
      if (photoBase64) {
        request.input("photo", sql.NVarChar, photoBase64);
        queryStr = `UPDATE Students
                  SET name=@name, email=@email, course=@course, state=@state, city=@city, age=@age, mobile=@mobile, photo=@photo, location=@location,latlong=@latlong
                  OUTPUT INSERTED.*
                  WHERE id=@id`;
      } else {
        queryStr = `UPDATE Students
                  SET name=@name, email=@email, course=@course, state=@state, city=@city, age=@age, mobile=@mobile, location=@location,latlong=@latlong
                  OUTPUT INSERTED.*
                  WHERE id=@id`;
      }

      const result = await request.query(queryStr);
      if (!result.recordset[0])
        return res.status(404).json({ error: "Not found" });
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.delete("/api/students/:id", authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Students OUTPUT DELETED.* WHERE id=@id");
    if (!result.recordset[0])
      return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted", student: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
