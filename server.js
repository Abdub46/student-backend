require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(cors()); // IMPORTANT for fetch()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

/* =======================
   POSTGRESQL CONNECTION
======================= */
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// Simple DB test (safe)
pool.query("SELECT 1")
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ DB connection error:", err.message));

/* =======================
   ROUTES
======================= */

// Health check
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// Insert student
app.post("/student", async (req, res) => {
  console.log("📥 Received body:", req.body);

  const { name, department, phone } = req.body;

  if (!name || !department || !phone) {
    return res.status(400).json({
      message: "All fields are required ❌",
      received: req.body
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO students (name, department, phone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), department.trim(), phone.trim()]
    );

    res.status(201).json({
      message: "Student saved successfully ✅",
      student: result.rows[0]
    });

  } catch (err) {
    console.error("❌ PostgreSQL error:", err);
    res.status(500).json({
      message: "Failed to save student ❌",
      error: err.message
    });
  }
});

// Fetch students
app.get("/students", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
