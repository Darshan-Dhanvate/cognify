import { GoogleGenerativeAI } from '@google/generative-ai';
import Task from '../models/Task.js';
import Intervention from '../models/Intervention.js';
import { recordEvent } from './events.js';

async function decompose(task) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `Break this work task into exactly 3 concrete steps, each taking 5 to 15 minutes. Return only JSON array of objects with a title field. Task: ${task.title}. Description: ${task.description || ''}`;
  const result = await model.generateContent(prompt);
  const clean = result.response.text().replace(/```json|```/g, '').trim();
  const steps = JSON.parse(clean).slice(0, 5).map(step => ({ title: String(step.title), timeEstimate: 10, isCompleted: false }));
  if (!steps.length) throw new Error('Decomposition returned no steps');
  task.microSteps = steps; task.isOverwhelming = true; await task.save();
  return steps;
}

export async function executeIntervention(userId, id) {
  const intervention = await Intervention.findOne({ _id: id, user: userId, status: 'offered' });
  if (!intervention) return null;
  const taskIds = intervention.recommendation?.taskIds || [];
  const tasks = await Task.find({ _id: { $in: taskIds }, user: userId, status: { $ne: 'Completed' } });
  let result;
  if (intervention.type === 'task_decomposition' && tasks[0]) result = { steps: await decompose(tasks[0]), taskId: tasks[0]._id };
  else if (intervention.type === 'schedule_review') result = { taskIds: tasks.map(task => task._id), message: 'Review these low-priority tasks before changing their dates.' };
  else result = { taskIds: tasks.slice(0, 2).map(task => task._id), message: 'Essential focus set prepared. Other tasks remain available.' };
  intervention.status = 'accepted'; intervention.userResponseAt = new Date(); await intervention.save();
  await recordEvent({ user: userId, eventType: 'intervention_accepted', metadata: { interventionId: id, type: intervention.type } });
  return { intervention, result };
}
