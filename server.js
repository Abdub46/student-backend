require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(cors({
  origin: "*", // allow frontend anywhere (safe for now)
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

/* =======================
   ENV VALIDATION
======================= */
const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"];
requiredEnv.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

/* =======================
   POSTGRESQL CONNECTION
======================= */
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false
  }
});

// Test DB connection with full logging
(async () => {
  try {
    const result = await pool.query("SELECT current_database(), current_user");
    console.log("✅ Connected to PostgreSQL");
    console.log(`🔐 SSL: ${isSupabase ? "ENABLED (Supabase)" : "DISABLED (Local)"}`);
    console.log("📚 Database info:", result.rows[0]);
  } catch (err) {
    console.error("❌ DB connection error FULL:", err);
    process.exit(1);
  }
})();

/* =======================
   ROUTES
======================= */

// Health check
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Server is running ✅" });
});

// Insert student
app.post("/student", async (req, res) => {
  const { name, department, phone } = req.body;

  if (!name || !department || !phone) {
    return res.status(400).json({ message: "All fields are required ❌" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO students (name, department, phone)
       VALUES ($1, $2, $3)
       RETURNING id, name, department, phone, created_at`,
      [name.trim(), department.trim(), phone.trim()]
    );

    console.log("✅ Inserted student:", result.rows[0]);
    res.status(201).json({
      message: "Student saved successfully ✅",
      student: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Insert error FULL:", err);
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
      "SELECT id, name, department, phone, created_at FROM students ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch error FULL:", err);
    res.status(500).json({
      message: "Failed to fetch students ❌",
      error: err.message
    });
  }
});

// Optional debug route to confirm DB info
app.get("/db-info", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database(), current_user");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   GLOBAL ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
