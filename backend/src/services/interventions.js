import Intervention from '../models/Intervention.js';
import Task from '../models/Task.js';

const COOLDOWN_HOURS = 24;

export async function offerForPrediction(prediction) {
  if (!prediction || prediction.riskScore < 75) return null;

  // Demo safeguard: Clear out existing pending interventions so the banner always triggers
  await Intervention.updateMany({ user: prediction.user, status: 'offered' }, { $set: { status: 'dismissed' } });

  const tasks = await Task.find({ user: prediction.user, status: { $ne: 'Completed' } }).lean();
  if (!tasks.length) return null;

  // Sorting Algorithm: Rank tasks by Priority first, then by Urgency (Deadline)
  const weights = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const diff = (weights[b.priority] || 0) - (weights[a.priority] || 0);
    if (diff !== 0) return diff; // Higher priority wins
    return new Date(a.dueDate || a.scheduledDate || 0) - new Date(b.dueDate || b.scheduledDate || 0); // Closer date wins
  });

  let type, recommendation;

  // 1. FOCUS MODE: Extreme risk. Pick the 2 most urgent, highest priority tasks.
  if (prediction.riskScore >= 85) {
    type = 'focus_mode';
    recommendation = { title: 'Work from an essential focus list', taskIds: sortedTasks.slice(0, 2).map(t => t._id) };
  } 
  // 2. TASK DECOMPOSITION: Find the single largest task (>= 2 hours) and break it down.
  else if (tasks.some(t => (t.estimatedTotalMinutes || 0) >= 120 || t.isOverwhelming)) {
    type = 'task_decomposition';
    const largestTask = [...tasks].sort((a, b) => (b.estimatedTotalMinutes || 0) - (a.estimatedTotalMinutes || 0))[0];
    recommendation = { title: 'Break one demanding task into smaller steps', taskIds: [largestTask._id] };
  } 
  // 3. SCHEDULE REVIEW: Moderate risk. Pick the least critical tasks to push back.
  else {
    type = 'schedule_review';
    // Reverse sort: lowest priority and furthest deadlines first
    const lowestPriorityTasks = [...tasks].sort((a, b) => {
      const diff = (weights[a.priority] || 0) - (weights[b.priority] || 0);
      if (diff !== 0) return diff; 
      return new Date(b.dueDate || b.scheduledDate || 0) - new Date(a.dueDate || a.scheduledDate || 0); 
    });
    recommendation = { title: 'Review and defer less critical work', taskIds: lowestPriorityTasks.slice(0, 3).map(t => t._id) };
  }

  if (!recommendation.taskIds?.length) return null;

  return Intervention.create({ 
    user: prediction.user, 
    prediction: prediction._id, 
    type, 
    triggerRisk: prediction.riskScore, 
    recommendation, 
    cooldownUntil: new Date(Date.now() + COOLDOWN_HOURS * 3600000) 
  });
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