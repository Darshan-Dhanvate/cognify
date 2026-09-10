import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { current, history, respond, execute, outcome } from '../controllers/interventions.js';
const router = Router(); router.use(requireUser); router.get('/current', current); router.get('/history', history); router.post('/:id/respond', respond); router.post('/:id/execute', execute); router.post('/:id/outcome', outcome); export default router;
