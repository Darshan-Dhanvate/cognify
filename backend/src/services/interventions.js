import Intervention from '../models/Intervention.js';
import Task from '../models/Task.js';

const COOLDOWN_HOURS = 24;
const RESET_LEVEL = 65;

function typeFor(risk, tasks) {
  if (risk >= 85) return 'focus_mode';
  if (tasks.some(task => task.isOverwhelming && task.status !== 'Completed')) return 'task_decomposition';
  return 'schedule_review';
}

export async function offerForPrediction(prediction) {
  if (!prediction || prediction.riskScore < 75) return null;
  const previous = await Intervention.findOne({ user: prediction.user }).sort({ createdAt: -1 });
  if (previous && previous.status === 'offered' && previous.triggerRisk >= RESET_LEVEL && previous.cooldownUntil > new Date()) return previous;
  if (previous?.cooldownUntil > new Date() && prediction.riskScore < 85) return null;
  if (previous && prediction.riskScore - previous.triggerRisk < 8 && prediction.riskScore < 85) return null;
  const tasks = await Task.find({ user: prediction.user, status: { $ne: 'Completed' } }).sort({ priority: -1, dueDate: 1 }).limit(5).lean();
  const type = typeFor(prediction.riskScore, tasks);
  const recommendation = type === 'task_decomposition'
    ? { title: 'Break one demanding task into smaller steps', taskIds: tasks.filter(task => task.isOverwhelming).slice(0, 1).map(task => task._id) }
    : type === 'focus_mode'
      ? { title: 'Work from an essential focus list', taskIds: tasks.slice(0, 2).map(task => task._id) }
      : { title: 'Review and defer low-priority work', taskIds: tasks.filter(task => task.priority === 'low').map(task => task._id) };
  if (!recommendation.taskIds?.length) return null;
  return Intervention.create({ user: prediction.user, prediction: prediction._id, type, triggerRisk: prediction.riskScore, recommendation, cooldownUntil: new Date(Date.now() + COOLDOWN_HOURS * 3600000) });
}

export async function updateIntervention(userId, id, status) {
  const intervention = await Intervention.findOne({ _id: id, user: userId });
  if (!intervention) return null;
  intervention.status = status; intervention.userResponseAt = new Date();
  if (status === 'completed') intervention.completedAt = new Date();
  return intervention.save();
}

export async function completeForTask(userId, taskId, riskAfter = null) {
  const intervention = await Intervention.findOne({ user: userId, status: 'accepted', 'recommendation.taskIds': taskId }).sort({ createdAt: -1 });
  if (!intervention) return null;
  intervention.status = 'completed';
  intervention.completedAt = new Date();
  if (riskAfter !== null && Number.isFinite(Number(riskAfter))) {
    intervention.riskAfter = Number(riskAfter);
    intervention.outcome = intervention.riskAfter < intervention.triggerRisk - 5 ? 'improved' : intervention.riskAfter > intervention.triggerRisk + 5 ? 'worsened' : 'unchanged';
  }
  return intervention.save();
}
