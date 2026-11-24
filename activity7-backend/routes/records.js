const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const FIELDS = "id, title, category, description, status";
const MAX_ID = 2147483647; // Postgres SERIAL limit

// Returns { id } or { error: {status, message} }
function parseId(raw) {
  if (!/^[1-9]\d*$/.test(raw)) {
    return { error: { status: 400, message: "Id must be a positive whole number." } };
  }
  const id = Number(raw);
  if (id > MAX_ID) {
    return { error: { status: 404, message: "Record not found." } };
  }
  return { id };
}

// Returns { values: [title, category, description, status] } or { message }
function validateBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object." };
  }
  const rules = [
    ["title", "Title", 3, 80],
    ["category", "Category", 2, 40],
    ["description", "Description", 5, 300]
  ];
  const values = [];
  for (const [key, label, min, max] of rules) {
    if (typeof body[key] !== "string") {
      return { message: `${label} is required and must be text.` };
    }
    const text = body[key].trim();
    if (text.length < min || text.length > max) {
      return { message: `${label} must have ${min} to ${max} characters.` };
    }
    values.push(text);
  }
  if (typeof body.status !== "string") {
    return { message: "Status is required and must be text." };
  }
  const status = body.status.trim();
  if (!STATUSES.includes(status)) {
    return { message: "Status must be Pending, In progress or Completed." };
  }
  values.push(status);
  return { values };
}

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${FIELDS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const parsed = parseId(req.params.id);
    if (parsed.error) return res.status(parsed.error.status).json({ message: parsed.error.message });

    const result = await pool.query(`SELECT ${FIELDS} FROM records WHERE id = $1`, [parsed.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const checked = validateBody(req.body);
    if (checked.message) return res.status(400).json({ message: checked.message });

    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) " +
        `VALUES ($1, $2, $3, $4) RETURNING ${FIELDS}`,
      checked.values
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const parsed = parseId(req.params.id);
    if (parsed.error) return res.status(parsed.error.status).json({ message: parsed.error.message });

    const checked = validateBody(req.body);
    if (checked.message) return res.status(400).json({ message: checked.message });

    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 " +
        `WHERE id = $5 RETURNING ${FIELDS}`,
      [...checked.values, parsed.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const parsed = parseId(req.params.id);
    if (parsed.error) return res.status(parsed.error.status).json({ message: parsed.error.message });

    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [parsed.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
