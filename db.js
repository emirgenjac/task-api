const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      lastError = err;
      await wait(1000);
    }
  }
  throw lastError;
}

async function init() {
  await connectWithRetry();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  const count = await pool.query("SELECT COUNT(*)::int AS count FROM tasks");
  if (count.rows[0].count !== 0) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", ["Learn Express", false]);
    await client.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", ["Build the task API", false]);
    await client.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", ["Publish to GitHub", false]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getAllTasks() {
  const result = await pool.query("SELECT * FROM tasks");
  return result.rows;
}

async function getTask(id) {
  const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function createTask(title) {
  const result = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
    [title, false]
  );
  return result.rows[0];
}

async function updateTask(id, title, done) {
  const result = await pool.query(
    "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
    [title, done, id]
  );
  return result.rows[0] || null;
}

async function deleteTask(id) {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  return result.rowCount > 0;
}

module.exports = { init, getAllTasks, getTask, createTask, updateTask, deleteTask };
