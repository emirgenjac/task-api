const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapi = require("./openapi.json");
const { init, getAllTasks, getTask, createTask, updateTask, deleteTask } = require("./db");

const PORT = 3000;

const app = express();
app.use(express.json());

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

app.get("/tasks", async (req, res, next) => {
  try {
    res.json(await getAllTasks());
  } catch (err) {
    next(err);
  }
});

app.get("/tasks/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    const task = await getTask(id);

    if (!task) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

app.post("/tasks", (req, res) => {
  const title = req.body && req.body.title;

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required" });
  }

  const task = createTask(title.trim());
  res.status(201).json(task);
});

app.put("/tasks/:id", async (req, res, next) => {
  try {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const existing = await getTask(id);

  if (!existing) {
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

  const title = hasTitle ? body.title.trim() : existing.title;
  const done = hasDone ? body.done : existing.done;
  const task = updateTask(id, title, done);
  res.json(task);
  } catch (err) {
    next(err);
  }
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const removed = deleteTask(id);

  if (!removed) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  res.status(204).end();
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "request body must be JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "something went wrong" });
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
