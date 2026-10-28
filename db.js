const path = require("path");
const { Pool } = require("pg");
const Database = require("better-sqlite3");

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

const db = new Database(path.join(__dirname, "tasks.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

function seedIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
  if (row.count !== 0) {
    return;
  }

  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  const insertExamples = db.transaction(() => {
    insert.run("Learn Express", 0);
    insert.run("Build the task API", 0);
    insert.run("Publish to GitHub", 0);
  });
  insertExamples();
}

seedIfEmpty();

function toTask(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    done: row.done === 1,
  };
}

function readSqliteTask(id) {
  return toTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
}

async function getAllTasks() {
  const result = await pool.query("SELECT * FROM tasks");
  return result.rows;
}

async function getTask(id) {
  const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return result.rows[0] || null;
}

function createTask(title) {
  const info = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)").run(title, 0);
  return readSqliteTask(Number(info.lastInsertRowid));
}

function updateTask(id, title, done) {
  const info = db
    .prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?")
    .run(title, done ? 1 : 0, id);

  if (info.changes === 0) {
    return null;
  }

  return readSqliteTask(id);
}

function deleteTask(id) {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return info.changes > 0;
}

module.exports = { init, getAllTasks, getTask, createTask, updateTask, deleteTask };
