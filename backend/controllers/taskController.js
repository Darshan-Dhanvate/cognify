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
    // Extracting all fields including the new targetDate and parentTask for the UI mapping
    const { title, description, priority, targetDate, parentTask, isOverwhelming } = req.body;
    let microSteps = [];

    // Trigger AI Intervention Protocol if the task is flagged
    if (isOverwhelming) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest"
        });
        
        const prompt = `Act as an expert productivity coach. The user is overwhelmed by the task: "${title}". 
        Break this task down into 3 extremely simple, frictionless micro-steps that take 5 minutes or less to complete. 
        Respond ONLY with a valid JSON array of objects. Do not include markdown formatting or backticks.
        Example format: [{"title": "Open a blank document"}, {"title": "Write the title"}]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        // Clean the response to ensure strict JSON parsing
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '');
        const parsedSteps = JSON.parse(cleanJson);
        
        // Map the parsed data to our Mongoose microStepSchema format
        microSteps = parsedSteps.map(step => ({
          title: step.title,
          timeEstimate: 5,
          isCompleted: false
        }));
      } catch (aiError) {
        console.error("AI Generation Failed (Rate Limit/Error):", aiError.message);
        // Fault Tolerance: The AI is busy, but we don't crash the app. We provide a manual fallback step.
        microSteps = [{ 
          title: "Break this task down manually (AI currently busy)", 
          timeEstimate: 5,
          isCompleted: false
        }];
      }
    }

    // The task gets created securely tied to the JWT user ID and mapped to the hierarchy/calendar
    const task = await Task.create({
      user: req.user._id, 
      title,
      description: description || '',
      priority: priority || 'medium',
      targetDate: targetDate || Date.now(), // Fallback to current date if none provided
      parentTask: parentTask || null,
      isOverwhelming: isOverwhelming || false,
      microSteps
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error("Task Creation Failed:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task (status or micro-steps)
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

    // Update the fields provided in the request
    task.status = req.body.status || task.status;
    task.microSteps = req.body.microSteps || task.microSteps;

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