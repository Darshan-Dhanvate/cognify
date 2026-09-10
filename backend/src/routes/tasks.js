import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { listTasks, createTask, updateTask, removeTask } from '../controllers/tasks.js';
const router = Router(); router.use(requireUser); router.get('/', listTasks); router.post('/', createTask); router.put('/:id', updateTask); router.delete('/:id', removeTask); export default router;
