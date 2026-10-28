const path = require("path");
const Database = require("better-sqlite3");

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

function getAllTasks() {
  return db.prepare("SELECT * FROM tasks").all().map(toTask);
}

function getTask(id) {
  return toTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
}

function createTask(title) {
  const info = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)").run(title, 0);
  return getTask(Number(info.lastInsertRowid));
}

function updateTask(id, title, done) {
  const info = db
    .prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?")
    .run(title, done ? 1 : 0, id);

  if (info.changes === 0) {
    return null;
  }

  return getTask(id);
}

function deleteTask(id) {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return info.changes > 0;
}

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask };
