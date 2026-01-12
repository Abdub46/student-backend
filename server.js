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
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

/* =======================
   ENV VALIDATION
======================= */
["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"].forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

/* =======================
   POSTGRESQL CONNECTION
======================= */
const isSupabase = process.env.DB_HOST.includes("supabase");
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false }
});

// Test DB connection
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

// Insert nutrition record
app.post("/nutrition", async (req, res) => {
  const {
    name,
    gender,
    age,
    weight,
    height,
    bmi,
    category,
    ideal_weight,
    energy
  } = req.body;

  // Basic validation
  if (!name || !gender || !age || !weight || !height || !bmi || !category || !energy) {
    return res.status(400).json({ message: "All fields are required ❌" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO nutrition_history
       (name, gender, age, weight, height, bmi, category, ideal_weight, energy)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, name, gender, age, weight, height, bmi, category, ideal_weight, energy, created_at`,
      [name.trim(), gender, age, weight, height, bmi, category, ideal_weight, energy]
    );

    res.status(201).json({
      message: "Nutrition record saved successfully ✅",
      record: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Insert error FULL:", err);
    res.status(500).json({
      message: "Failed to save nutrition record ❌",
      error: err.message
    });
  }
});

// Fetch all nutrition records
app.get("/nutrition", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, gender, age, weight, height, bmi, category, ideal_weight, energy, created_at
       FROM students
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch records:", err);
    res.status(500).json({ message: "Failed to fetch records", error: err.message });
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
