require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
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
const isProduction = process.env.NODE_ENV === "production";


const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,

  /*Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false }*/

  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Test DB connection
(async () => {
  try {
    const result = await pool.query("SELECT current_database(), current_user");
    console.log("✅ Connected to PostgreSQL");
    console.log("📚 Database info:", result.rows[0]);
  } catch (err) {
    console.error("❌ DB connection error:", err);
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

// POST nutrition record
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

  if (!name || !gender || !age || !weight || !height || !bmi || !category || !energy) {
    return res.status(400).json({ message: "All fields are required ❌" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO nutrition_history
       (name, gender, age, weight, height, bmi, category, ideal_weight, energy)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [name.trim(), gender, age, weight, height, bmi, category, ideal_weight, energy]
    );

    res.status(201).json({
      message: "Nutrition record saved successfully ✅",
      record: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Insert error:", err);
    res.status(500).json({ message: "Failed to save record ❌", error: err.message });
  }
});

// GET all nutrition records
app.get("/nutrition", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM nutrition_history ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "Failed to fetch records ❌", error: err.message });
  }
});


//Delete records
app.delete("/nutrition/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM nutrition_history WHERE id = $1",
      [req.params.id]
    );
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
