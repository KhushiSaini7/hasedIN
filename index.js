// index.js
const express = require('express');
const { v4: uuid } = require('uuid');
const app = express();
app.use(express.json());

// In-memory storage\const boards = {};
const columns = {};
const tasks = {};

// 1. Add Column
app.post('/boards/:boardId/columns', (req, res) => {
  const { boardId } = req.params;
  if (!boards[boardId]) return res.sendStatus(404);
  const colId = uuid();
  const col = { id: colId, name: req.body.name, order: boards[boardId].columns.length, tasks: [] };
  columns[colId] = col;
  boards[boardId].columns.push(col);
  res.status(201).json(col);
});

// 2. Add Task
app.post('/columns/:columnId/tasks', (req, res) => {
  const { columnId } = req.params;
  const col = columns[columnId];
  if (!col) return res.sendStatus(404);
  const taskId = uuid();
  const task = { id: taskId, title: req.body.title, order: col.tasks.length };
  tasks[taskId] = task;
  col.tasks.push(task);
  res.status(201).json(task);
});

// 3. List Tasks
app.get('/columns/:columnId/tasks', (req, res) => {
  const col = columns[req.params.columnId];
  if (!col) return res.sendStatus(404);
  res.json(col.tasks.sort((a,b) => a.order - b.order));
});

// 4. Move Task
app.put('/tasks/:taskId/move', (req, res) => {
  const { targetColumnId, newOrder } = req.body;
  const task = tasks[req.params.taskId];
  if (!task || !columns[targetColumnId]) return res.sendStatus(404);
  // remove from old
  Object.values(columns).forEach(col => {
    col.tasks = col.tasks.filter(t => t.id !== task.id);
    col.tasks.forEach((t,i) => t.order = i);
  });
  // add to new
  const target = columns[targetColumnId];
  task.order = Math.min(newOrder, target.tasks.length);
  target.tasks.splice(task.order, 0, task);
  target.tasks.forEach((t,i) => t.order = i);
  res.json(task);
});

// 5. Reorder Task
app.put('/tasks/:taskId/reorder', (req, res) => {
  const { newOrder } = req.body;
  const task = tasks[req.params.taskId];
  if (!task) return res.sendStatus(404);
  const col = Object.values(columns).find(c => c.tasks.some(t => t.id === task.id));
  col.tasks = col.tasks.filter(t => t.id !== task.id);
  task.order = Math.min(newOrder, col.tasks.length);
  col.tasks.splice(task.order, 0, task);
  col.tasks.forEach((t,i) => t.order = i);
  res.json(task);
});

// 6. Full Board View
app.get('/boards/:boardId/view', (req, res) => {
  const board = boards[req.params.boardId];
  if (!board) return res.sendStatus(404);
  const result = {
    ...board,
    columns: board.columns
      .sort((a,b) => a.order - b.order)
      .map(col => ({
        ...col,
        tasks: col.tasks.sort((a,b) => a.order - b.order)
      }))
  };
  res.json(result);
});

// Helper: Create Board
app.post('/boards', (req, res) => {
  const id = uuid();
  boards[id] = { id, name: req.body.name || 'Untitled', columns: [] };
  res.status(201).json(boards[id]);
});

app.listen(3000, () => console.log('Server on 3000'));