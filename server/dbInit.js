const { sql, getPool } = require("./db");

async function initDb() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'States')
      BEGIN
        CREATE TABLE States (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(100) UNIQUE NOT NULL
        )
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL,
          Role NVARCHAR(50) NOT NULL,
          Email NVARCHAR(100) UNIQUE NOT NULL,
          Phone NVARCHAR(20) NULL,
          Password NVARCHAR(100) NOT NULL,
          Force_Password NVARCHAR(5) DEFAULT 'N' NOT NULL,
          CreatedBy INT NULL,
          CreatedDate DATETIME DEFAULT GETUTCDATE() NOT NULL,
          UpdatedBy INT NULL,
          UpdatedDate DATETIME NULL,
          TempPassword NVARCHAR(100) NULL,
          IsTempPassword BIT DEFAULT 0 NOT NULL
        )
      END
    `);

    const usersCount = await pool
      .request()
      .query("SELECT COUNT(*) AS total FROM Users");
    if (usersCount.recordset[0].total === 0) {
      await pool
        .request()
        .input("name", sql.NVarChar, "Vinay")
        .input("role", sql.NVarChar, "Headmaster")
        .input("email", sql.NVarChar, "vinay@example.com")
        .input("password", sql.NVarChar, "Password@123").query(`
          INSERT INTO Users (Name, Role, Email, Password, Force_Password, CreatedBy, CreatedDate, IsTempPassword)
          VALUES (@name, @role, @email, @password, 'N', NULL, GETUTCDATE(), 0)
        `);
    }

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Students')
      BEGIN
        CREATE TABLE Students (
          id INT IDENTITY(1,1) PRIMARY KEY,
          student_id NVARCHAR(50) NULL,
          name NVARCHAR(100) NULL,
          email NVARCHAR(100) NULL,
          course NVARCHAR(100) NULL,
          state NVARCHAR(100) NULL,
          city NVARCHAR(100) NULL,
          age INT NULL,
          mobile NVARCHAR(15) NULL,
          photo NVARCHAR(MAX) NULL,
          createdBy INT NULL,
          createdDate DATETIME DEFAULT GETUTCDATE() NOT NULL
        )
      END
    `);

    await pool.request().query(`
      IF OBJECT_ID('Cities', 'U') IS NOT NULL
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Cities') AND name = 'stateId')
        BEGIN
          DROP TABLE Cities
        END
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cities')
      BEGIN
        CREATE TABLE Cities (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL,
          stateId INT FOREIGN KEY REFERENCES States(id) ON DELETE CASCADE,
          CONSTRAINT UC_City_State UNIQUE (name, stateId)
        )
      END
    `);

    await pool.request().query(`
      IF OBJECT_ID('Courses', 'U') IS NOT NULL
      BEGIN
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Courses') AND (name = 'stateId' OR name = 'cityId'))
        BEGIN
          DROP TABLE Courses
        END
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Courses')
      BEGIN
        CREATE TABLE Courses (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(100) UNIQUE NOT NULL
        )
      END
    `);

    await pool.request().query(`
      IF OBJECT_ID('Students', 'U') IS NOT NULL
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'state')
        BEGIN
          ALTER TABLE Students ADD state NVARCHAR(100) NULL
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'student_id')
        BEGIN
          ALTER TABLE Students ADD student_id NVARCHAR(50) NULL
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'photo')
        BEGIN
          ALTER TABLE Students ADD photo NVARCHAR(MAX) NULL
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'createdBy')
        BEGIN
          ALTER TABLE Students ADD createdBy INT NULL
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'createdDate')
        BEGIN
          ALTER TABLE Students ADD createdDate DATETIME DEFAULT GETUTCDATE() NOT NULL
        END
      END
    `);

    const statesCount = await pool
      .request()
      .query("SELECT COUNT(*) AS total FROM States");
    if (statesCount.recordset[0].total === 0) {
      const defaults = [
        { state: "Bihar", cities: ["Sasaram", "Patna", "Gaya"] },
        { state: "UP", cities: ["Noida", "Lucknow", "Kanpur"] },
        { state: "Karnataka", cities: ["Bengaluru", "Mysore"] },
      ];
      for (const item of defaults) {
        const res = await pool
          .request()
          .input("name", sql.NVarChar, item.state)
          .query("INSERT INTO States (name) OUTPUT INSERTED.id VALUES (@name)");
        const stateId = res.recordset[0].id;
        for (const city of item.cities) {
          await pool
            .request()
            .input("name", sql.NVarChar, city)
            .input("stateId", sql.Int, stateId)
            .query(
              "INSERT INTO Cities (name, stateId) VALUES (@name, @stateId)",
            );
        }
      }
      console.log("Seeded default states and cities");
    }

    const coursesCount = await pool
      .request()
      .query("SELECT COUNT(*) AS total FROM Courses");
    if (coursesCount.recordset[0].total === 0) {
      const defaultCourses = [
        "BCA",
        "MCA",
        "B.Tech",
        "M.Tech",
        "MBA",
        "BBA",
        "BSc",
        "MSc",
      ];
      for (const course of defaultCourses) {
        await pool
          .request()
          .input("name", sql.NVarChar, course)
          .query("INSERT INTO Courses (name) VALUES (@name)");
      }
      console.log("Seeded default courses");
    }

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'matrix')
      BEGIN
        CREATE TABLE matrix (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
          level INT NOT NULL
        )
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_desired')
      BEGIN
        CREATE TABLE student_desired (
          id INT IDENTITY(1,1) PRIMARY KEY,
          student_id INT FOREIGN KEY REFERENCES Students(id) ON DELETE CASCADE,
          level INT DEFAULT 1 NOT NULL,
          user_id INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
          created_at DATETIME DEFAULT GETUTCDATE() NOT NULL
        )
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_flow')
      BEGIN
        CREATE TABLE student_flow (
          id INT IDENTITY(1,1) PRIMARY KEY,
          student_id INT FOREIGN KEY REFERENCES Students(id) ON DELETE CASCADE,
          student_desired_id INT FOREIGN KEY REFERENCES student_desired(id) ON DELETE NO ACTION,
          user_id INT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
          level INT NOT NULL,
          decision NVARCHAR(50) NULL,
          remarks NVARCHAR(MAX) NULL,
          decision_datetime DATETIME DEFAULT GETUTCDATE() NOT NULL,
          status CHAR(1) DEFAULT 'N' NOT NULL,
          updated_by INT NULL FOREIGN KEY REFERENCES Users(Id),
          updated_at DATETIME NULL,
          CONSTRAINT CK_student_flow_decision CHECK (decision IS NULL OR decision IN ('Approved', 'Rejected', 'Returned', 'Forward', 'Forwarded')),
          CONSTRAINT CK_student_flow_status CHECK (status IN ('Y', 'N'))
        )
      END
    `);

    const matrixCount = await pool
      .request()
      .query("SELECT COUNT(*) AS total FROM matrix");
    if (matrixCount.recordset[0].total === 0) {
      await pool.request().query(`
        INSERT INTO matrix (user_id, level)
        SELECT Id, 1 FROM Users WHERE Role = 'Teacher'
        UNION ALL
        SELECT Id, 2 FROM Users WHERE Role = 'Headmaster'
      `);
    }

    console.log("Database initialization completed.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

module.exports = { initDb };
