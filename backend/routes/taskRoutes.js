import express from 'express';
import { createTask, getTasks, updateTask, deleteTask, deleteAllTasks } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createTask)
  .get(protect, getTasks);

// The Nuke Route MUST go before /:id
router.route('/clear')
  .delete(protect, deleteAllTasks);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

export default router;