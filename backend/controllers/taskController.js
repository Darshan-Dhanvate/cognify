import Task from '../models/Task.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Get logged in user's tasks
// @route   GET /api/tasks
// @access  Private (Requires JWT)
export const getTasks = async (req, res) => {
  try {
    // This finds ONLY the tasks belonging to the logged-in user
    // .sort({ dueDate: 1 }) organizes them chronologically for the daily stack UI
    const tasks = await Task.find({ user: req.user._id }).sort({ dueDate: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ message: 'Server Error: Could not fetch tasks' });
  }
};

// @desc    Create a new task & trigger AI if overwhelming
// @route   POST /api/tasks
// @access  Private (Requires JWT)
export const createTask = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      scheduledDate, 
      dueDate, 
      parentTask, 
      isOverwhelming,
      taskType,
      dependencies
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Task title is required' });

    let microSteps = [];

    // AI is ONLY triggered for deep-work that is flagged as overwhelming
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

// @desc    Update a task (status, dates, micro-steps, etc.)
// @route   PUT /api/tasks/:id
// @access  Private (Requires JWT)
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Security Check: Ensure the logged-in user actually owns this task
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this task' });
    }

    // Dynamically update fields if they are provided in the request body
    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.taskType !== undefined) task.taskType = req.body.taskType;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.scheduledDate !== undefined) task.scheduledDate = req.body.scheduledDate;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.microSteps !== undefined) task.microSteps = req.body.microSteps;

    // If all micro-steps are completed, automatically complete the main task
    if (task.microSteps && task.microSteps.length > 0) {
      const allStepsDone = task.microSteps.every(step => step.isCompleted);
      if (allStepsDone) {
        task.status = 'Completed';
      }
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error("Task Update Failed:", error.message);
    res.status(500).json({ message: 'Server Error: Could not update task' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Security Check: Ensure the logged-in user actually owns this task
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task permanently deleted' });
  } catch (error) {
    console.error("Task Deletion Failed:", error.message);
    res.status(500).json({ message: 'Server Error: Could not delete task' });
  }
};

// @desc    Delete ALL tasks for a user
// @route   DELETE /api/tasks/clear
// @access  Private
export const deleteAllTasks = async (req, res) => {
  try {
    await Task.deleteMany({ user: req.user._id });
    res.json({ message: 'All tasks wiped successfully' });
  } catch (error) {
    console.error("Failed to clear tasks:", error.message);
    res.status(500).json({ message: 'Server Error: Could not clear tasks' });
  }
};