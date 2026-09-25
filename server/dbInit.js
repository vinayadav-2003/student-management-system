const { getPool } = require("./db");

async function initDb() {
  if (process.platform !== 'win32' && !process.env.DATABASE_URL) {
    console.log("No DATABASE_URL configured on cloud host. Skipping database initialization.");
    return;
  }

  try {
    const pool = await getPool();

    // Use raw pg pool for DDL (schema creation)
    const { Pool } = require('pg');
    require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

    const rawPool = new Pool({
      connectionString: process.env.DATABASE_URL,
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

    const exec = async (sql) => rawPool.query(sql);

    // ── States ─────────────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS "States" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);

    // ── Users ──────────────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "Id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(100) NOT NULL,
        "Role" VARCHAR(50) NOT NULL,
        "Email" VARCHAR(100) UNIQUE NOT NULL,
        "Phone" VARCHAR(20) NULL,
        "Password" VARCHAR(100) NOT NULL,
        "Force_Password" VARCHAR(5) DEFAULT 'N' NOT NULL,
        "CreatedBy" INT NULL,
        "CreatedDate" TIMESTAMP DEFAULT NOW() NOT NULL,
        "UpdatedBy" INT NULL,
        "UpdatedDate" TIMESTAMP NULL,
        "TempPassword" VARCHAR(100) NULL,
        "IsTempPassword" BOOLEAN DEFAULT FALSE NOT NULL
      )
    `);

    // Seed default admin user if none exists
    const usersCount = await rawPool.query('SELECT COUNT(*) AS total FROM "Users"');
    if (parseInt(usersCount.rows[0].total) === 0) {
      await rawPool.query(`
        INSERT INTO "Users" ("Name", "Role", "Email", "Password", "Force_Password", "CreatedBy", "CreatedDate", "IsTempPassword")
        VALUES ($1, $2, $3, $4, 'N', NULL, NOW(), FALSE)
      `, ['Vinay', 'Headmaster', 'vinay@example.com', 'Password@123']);
      console.log('Seeded default admin user: vinay@example.com / Password@123');
    }

    // ── Cities ─────────────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS "Cities" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        "stateId" INT REFERENCES "States"(id) ON DELETE CASCADE,
        CONSTRAINT "UC_City_State" UNIQUE (name, "stateId")
      )
    `);

    // ── Courses ────────────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS "Courses" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);

    // ── Students ───────────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS "Students" (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) NULL,
        name VARCHAR(100) NULL,
        email VARCHAR(100) NULL,
        course VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        city VARCHAR(100) NULL,
        age INT NULL,
        mobile VARCHAR(15) NULL,
        photo TEXT NULL,
        location VARCHAR(255) NULL,
        latlong VARCHAR(100) NULL,
        latest_request_status VARCHAR(50) NULL,
        "createdBy" INT NULL,
        "createdDate" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // ── Matrix ─────────────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS matrix (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES "Users"("Id") ON DELETE CASCADE,
        level INT NOT NULL
      )
    `);

    // ── Student Desired ────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS student_desired (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES "Students"(id) ON DELETE CASCADE,
        level INT DEFAULT 1 NOT NULL,
        user_id INT REFERENCES "Users"("Id") ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // ── Student Flow ───────────────────────────────────────────────────────────
    await exec(`
      CREATE TABLE IF NOT EXISTS student_flow (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES "Students"(id) ON DELETE CASCADE,
        student_desired_id INT REFERENCES student_desired(id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED,
        user_id INT REFERENCES "Users"("Id") ON DELETE SET NULL,
        level INT NOT NULL,
        decision VARCHAR(50) NULL,
        remarks TEXT NULL,
        decision_datetime TIMESTAMP DEFAULT NOW() NOT NULL,
        status CHAR(1) DEFAULT 'N' NOT NULL,
        updated_by INT REFERENCES "Users"("Id"),
        updated_at TIMESTAMP NULL,
        CONSTRAINT "CK_student_flow_decision" CHECK (decision IS NULL OR decision IN ('Approved', 'Rejected', 'Returned', 'Forward', 'Forwarded')),
        CONSTRAINT "CK_student_flow_status" CHECK (status IN ('Y', 'N'))
      )
    `);

    // ── Seed States & Cities ───────────────────────────────────────────────────
    const statesCount = await rawPool.query('SELECT COUNT(*) AS total FROM "States"');
    if (parseInt(statesCount.rows[0].total) === 0) {
      const defaults = [
        { state: 'Bihar', cities: ['Sasaram', 'Patna', 'Gaya'] },
        { state: 'UP', cities: ['Noida', 'Lucknow', 'Kanpur'] },
        { state: 'Karnataka', cities: ['Bengaluru', 'Mysore'] },
      ];
      for (const item of defaults) {
        const res = await rawPool.query(
          'INSERT INTO "States" (name) VALUES ($1) RETURNING id',
          [item.state],
        );
        const stateId = res.rows[0].id;
        for (const city of item.cities) {
          await rawPool.query(
            'INSERT INTO "Cities" (name, "stateId") VALUES ($1, $2)',
            [city, stateId],
          );
        }
      }
      console.log('Seeded default states and cities');
    }

    // ── Seed Courses ───────────────────────────────────────────────────────────
    const coursesCount = await rawPool.query('SELECT COUNT(*) AS total FROM "Courses"');
    if (parseInt(coursesCount.rows[0].total) === 0) {
      const defaultCourses = ['BCA', 'MCA', 'B.Tech', 'M.Tech', 'MBA', 'BBA', 'BSc', 'MSc'];
      for (const course of defaultCourses) {
        await rawPool.query('INSERT INTO "Courses" (name) VALUES ($1)', [course]);
      }
      console.log('Seeded default courses');
    }

    // ── Seed Matrix ────────────────────────────────────────────────────────────
    const matrixCount = await rawPool.query('SELECT COUNT(*) AS total FROM matrix');
    if (parseInt(matrixCount.rows[0].total) === 0) {
      await rawPool.query(`
        INSERT INTO matrix (user_id, level)
        SELECT "Id", 1 FROM "Users" WHERE "Role" = 'Teacher'
        UNION ALL
        SELECT "Id", 2 FROM "Users" WHERE "Role" = 'Headmaster'
      `);
      console.log('Seeded matrix');
    }

    await rawPool.end();
    console.log('✅ Database initialization completed (PostgreSQL)');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  }
}

module.exports = { initDb };
