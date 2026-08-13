import Task from '../models/Task.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ dueDate: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ message: 'Server Error: Could not fetch tasks' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { 
      title, description, priority, scheduledDate, dueDate, 
      parentTask, isOverwhelming, taskType, dependencies
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Task title is required' });

    let microSteps = [];
    const isDeepWork = !taskType || taskType === 'deep-work';
    
    if (isOverwhelming && isDeepWork) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `Act as an expert productivity coach. The user is overwhelmed by the task: "${title}". 
        Break this task down into 3 extremely simple, frictionless micro-steps that take 5 minutes or less to complete. 
        Respond ONLY with a valid JSON array of objects. Do not include markdown formatting or backticks.
        Example format: [{"title": "Open a blank document"}, {"title": "Write the title"}]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '');
        const parsedSteps = JSON.parse(cleanJson);
        
        microSteps = parsedSteps.map(step => ({
          title: step.title,
          timeEstimate: 5,
          isCompleted: false
        }));
      } catch (aiError) {
        console.error("AI Generation Failed:", aiError.message);
        microSteps = [{ title: "Break this task down manually", timeEstimate: 5, isCompleted: false }];
      }
    }

    const task = await Task.create({
      user: req.user._id, 
      title,
      description: description || '',
      taskType: taskType || 'deep-work',
      priority: priority || 'medium',
      scheduledDate: scheduledDate || null,
      dueDate: dueDate || null,
      parentTask: parentTask || null,
      dependencies: dependencies || [],
      isOverwhelming: isDeepWork ? (isOverwhelming || false) : false,
      microSteps
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error("Task Creation Failed:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this task' });
    }

    // 🧠 ML Telemetry: Track Procrastination (Push Count)
    if (req.body.scheduledDate && new Date(req.body.scheduledDate) > task.scheduledDate) {
        task.pushCount += 1;
    }

    // 🧠 ML Telemetry: Track Execution Velocity Timestamps
    if (req.body.status && req.body.status !== task.status) {
        if (req.body.status === 'In-Progress' && !task.startedAt) {
            task.startedAt = new Date(); // Start the clock
        }
        if (req.body.status === 'Completed') {
            task.completedAt = new Date(); // Stop the clock
        }
    }

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.taskType !== undefined) task.taskType = req.body.taskType;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.scheduledDate !== undefined) task.scheduledDate = req.body.scheduledDate;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.microSteps !== undefined) task.microSteps = req.body.microSteps;

    if (task.microSteps && task.microSteps.length > 0) {
      const allStepsDone = task.microSteps.every(step => step.isCompleted);
      if (allStepsDone) {
        task.status = 'Completed';
        if (!task.completedAt) task.completedAt = new Date();
      }
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error("Task Update Failed:", error.message);
    res.status(500).json({ message: 'Server Error: Could not update task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    // 🛡️ Strict Cascade Deletion Logic
    // 1. Delete all sub-tasks nested under this parent
    await Task.deleteMany({ parentTask: task._id });
    
    // 2. Remove this task's ID from any other task's dependencies array
    await Task.updateMany(
        { dependencies: task._id },
        { $pull: { dependencies: task._id } }
    );

    // 3. Finally, delete the task itself
    await task.deleteOne();
    
    res.json({ message: 'Task and associated dependencies permanently deleted' });
  } catch (error) {
    console.error("Task Deletion Failed:", error.message);
    res.status(500).json({ message: 'Server Error: Could not delete task' });
  }
};

export const deleteAllTasks = async (req, res) => {
  try {
    await Task.deleteMany({ user: req.user._id });
    res.json({ message: 'All tasks wiped successfully' });
  } catch (error) {
    console.error("Failed to clear tasks:", error.message);
    res.status(500).json({ message: 'Server Error: Could not clear tasks' });
  }
};