const express = require("express");

const app = express();
const PORT = 3000;

const tasks = [
  { id: 1, title: "Learn Express", done: false },
  { id: 2, title: "Build the task API", done: false },
  { id: 3, title: "Publish to GitHub", done: false },
];

function findTask(id) {
  return tasks.find((task) => task.id === id);
}

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = findTask(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  res.json(task);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
