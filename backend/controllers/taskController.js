import Task from '../models/Task.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const createTask = async (req, res) => {
  try {
    const { user, title, isOverwhelming } = req.body;
    let microSteps = [];

    if (isOverwhelming) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
        console.error("AI Generation Failed (Rate Limit/Error):", aiError.message);
        // The AI is busy, but we don't crash. We provide a manual fallback step.
        microSteps = [{ title: "Break this task down manually (AI currently busy)", timeEstimate: 5 }];
      }
    }

    // The task STILL gets created even if the AI fails
    const task = await Task.create({
      user,
      title,
      isOverwhelming,
      microSteps
    });
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};