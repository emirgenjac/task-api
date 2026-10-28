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

module.exports = { db };
