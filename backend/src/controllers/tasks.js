import Task from '../models/Task.js';
import { recordEvent } from '../services/events.js';
import { predictForUser } from '../services/prediction.js';
import { completeForTask } from '../services/interventions.js';

async function refreshPrediction(userId, trigger) {
  try { await predictForUser(userId, trigger); return true; } catch (error) { console.warn(`Prediction skipped (${trigger}): ${error.message}`); return false; }
}

export async function listTasks(req, res) { res.json(await Task.find({ user: req.user._id }).sort({ dueDate: 1, createdAt: -1 }).lean()); }

export async function createTask(req, res) {
  const { title, description, taskType, priority, scheduledDate, dueDate, isOverwhelming, parentTask, dependencies, estimatedTotalMinutes } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Task title is required' });
  const task = await Task.create({ user: req.user._id, title: title.trim(), description, taskType, priority, scheduledDate, dueDate, isOverwhelming, parentTask, dependencies, estimatedTotalMinutes });
  await recordEvent({ user: req.user._id, task: task._id, eventType: 'task_created' });
  const predictionUpdated = await refreshPrediction(req.user._id, 'task_created');
  res.status(201).json({ ...task.toObject(), predictionUpdated });
}

export async function updateTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const before = task.toObject();
  const allowed = ['title', 'description', 'taskType', 'priority', 'status', 'scheduledDate', 'dueDate', 'microSteps', 'estimatedTotalMinutes', 'dependencies', 'isOverwhelming'];
  for (const key of allowed) if (req.body[key] !== undefined) task[key] = req.body[key];
  if (req.body.status === 'In-Progress') {
    if (before.status === 'Completed') task.completedAt = undefined;
    if (!task.startedAt) task.startedAt = new Date();
  }
  if (req.body.status === 'Pending') {
    task.startedAt = undefined;
    task.completedAt = undefined;
  }
  if (req.body.status === 'Completed') {
    if (!task.startedAt) task.startedAt = new Date();
    if (!task.completedAt) task.completedAt = new Date();
  }
  if (Array.isArray(task.microSteps) && task.microSteps.length && task.microSteps.every(step => step.isCompleted)) { task.status = 'Completed'; task.completedAt ||= new Date(); }
  const saved = await task.save();
  const eventType = req.body.status === 'Completed' && before.status !== 'Completed' ? 'task_completed' : req.body.status === 'In-Progress' && before.status !== 'In-Progress' ? 'task_started' : req.body.scheduledDate !== undefined && String(before.scheduledDate) !== String(saved.scheduledDate) ? 'task_rescheduled' : 'task_updated';
  await recordEvent({ user: req.user._id, task: saved._id, eventType, previousValue: before, newValue: saved.toObject() });
  if (eventType === 'task_completed') await completeForTask(req.user._id, saved._id);
  const predictionUpdated = await refreshPrediction(req.user._id, eventType);
  res.json({ ...saved.toObject(), predictionUpdated });
}

export async function removeTask(req, res) { const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id }); if (!task) return res.status(404).json({ message: 'Task not found' }); await recordEvent({ user: req.user._id, task: task._id, eventType: 'task_deleted' }); const predictionUpdated = await refreshPrediction(req.user._id, 'task_deleted'); res.json({ message: 'Task deleted', predictionUpdated }); }
