const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapi = require("./openapi.json");
const { getAllTasks, getTask } = require("./db");

const PORT = 3000;

const tasks = [
  { id: 1, title: "Learn Express", done: false },
  { id: 2, title: "Build the task API", done: false },
  { id: 3, title: "Publish to GitHub", done: false },
];
let nextId = 4;

const app = express();
app.use(express.json());

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
  res.json(getAllTasks());
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const task = getTask(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  res.json(task);
});

app.post("/tasks", (req, res) => {
  const title = req.body && req.body.title;

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required" });
  }

  const task = { id: nextId, title: title.trim(), done: false };
  nextId += 1;
  tasks.push(task);
  res.status(201).json(task);
});

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = findTask(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "request body is required" });
  }

  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const hasDone = Object.prototype.hasOwnProperty.call(body, "done");

  if (!hasTitle && !hasDone) {
    return res.status(400).json({ error: "title or done is required" });
  }

  if (hasTitle && (typeof body.title !== "string" || body.title.trim() === "")) {
    return res.status(400).json({ error: "title is required" });
  }

  if (hasDone && typeof body.done !== "boolean") {
    return res.status(400).json({ error: "done must be true or false" });
  }

  if (hasTitle) {
    task.title = body.title.trim();
  }
  if (hasDone) {
    task.done = body.done;
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).end();
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "request body must be JSON" });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
