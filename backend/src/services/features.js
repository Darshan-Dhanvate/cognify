import Task from '../models/Task.js';
import Journal from '../models/Journal.js';
import TaskEvent from '../models/TaskEvent.js';
import User from '../models/User.js';

const since = days => new Date(Date.now() - days * 86400000);
function dateKey(value, timezone = 'UTC') {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const get = type => parts.find(part => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export async function buildFeatures(userId) {
  const [tasks, events, journals, user] = await Promise.all([
    Task.find({ user: userId }).lean(),
    TaskEvent.find({ user: userId, createdAt: { $gte: since(7) } }).lean(),
    Journal.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    User.findById(userId).select('timezone').lean(),
  ]);
  
  const recentEvents = events;
  const created = recentEvents.filter(e => e.eventType === 'task_created').length;
  const completed = recentEvents.filter(e => e.eventType === 'task_completed').length;
  const rescheduled = recentEvents.filter(e => e.eventType === 'task_rescheduled').length;
  
  const now = new Date();
  const timezone = user?.timezone || 'UTC';
  const today = dateKey(now, timezone);
  
  const overdue = tasks.filter(t => t.status !== 'Completed' && dateKey(t.dueDate || t.scheduledDate, timezone) < today).length;
  const active = tasks.filter(t => t.status !== 'Completed');
  const blocked = active.filter(t => (t.dependencies || []).length > 0).length;
  
  const estimated = tasks.filter(t => t.createdAt >= since(7) && t.estimatedTotalMinutes > 0).map(t => t.estimatedTotalMinutes);
  const actual = tasks.filter(t => t.completedAt && new Date(t.completedAt) >= since(7) && t.startedAt).map(t => (new Date(t.completedAt) - new Date(t.startedAt)) / 60000);
  const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  
  const latest = journals[0]?.analysis || {};
  const high = tasks.filter(t => ['high', 'critical'].includes(t.priority)).length;
  const critical = tasks.filter(t => t.priority === 'critical').length;
  
  const completedToday = tasks.filter(t => t.status === 'Completed' && dateKey(t.completedAt, timezone) === today).reduce((sum, t) => sum + (t.estimatedTotalMinutes || 0), 0);
  const completionRate = created ? completed / created * 100 : 0;

  // --- Time-Decay Deadline Pressure Logic ---
  let upcomingPressure = 0;
  let scheduledToday = 0;
  
  active.forEach(t => {
    const targetStr = dateKey(t.dueDate || t.scheduledDate, timezone);
    if (!targetStr) return;
    
    // Use midday to safely calculate day differences ignoring daylight savings
    const targetDate = new Date(`${targetStr}T12:00:00`); 
    const todayDate = new Date(`${today}T12:00:00`);
    const daysRemaining = Math.round((targetDate - todayDate) / 86400000);
    
    const mins = t.estimatedTotalMinutes || 25;

    if (daysRemaining === 0) scheduledToday += mins;
    
    // Apply time-decay weight for tasks due within the next 7 days
    if (daysRemaining >= 0 && daysRemaining <= 7) {
      const weight = 1 / (daysRemaining + 1); // Today=1.0, Tmrw=0.5, Day3=0.33...
      upcomingPressure += mins * weight;
    }
  });

  // Assume ~8 hours (480 mins) of weighted pressure is a critical load
  const deadlinePressure = Math.min(1, (overdue / 8 * 0.4) + (upcomingPressure / 480 * 0.6));

  return {
    nlpStress: Number(latest.stressScore || 0), sentimentPolarity: Number(latest.sentimentPolarity || 0),
    detectedDistortionCount: (latest.detectedDistortions || []).length, journalFrequency7d: journals.filter(j => new Date(j.createdAt) >= since(7)).length,
    tasksCreated7d: created, tasksCompleted7d: completed, tasksOverdue: overdue, tasksRescheduled7d: rescheduled,
    averagePushCount7d: created ? rescheduled / created : 0, completionRate7d: completionRate,
    averageEstimatedMinutes7d: average(estimated), averageActualMinutes7d: average(actual), velocityDelta7d: average(actual) - average(estimated),
    activeTaskCount: active.length, highPriorityTaskCount: high, criticalTaskCount: critical, blockedTaskCount: blocked, dependencyFriction: blocked,
    todayScheduledMinutes: scheduledToday, todayCompletedMinutes: completedToday,
    deadlinePressure: deadlinePressure,
  };
}