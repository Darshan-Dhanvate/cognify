import Task from '../models/Task.js';

export const createTask = async (req, res) => {
  try {
    const { user, title, isOverwhelming } = req.body;
    
    // Note: Later, 'user' will come from a secure JWT token. 
    // For testing today, we will pass the user ID directly in the request.
    const task = await Task.create({
      user,
      title,
      isOverwhelming
    });
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};