import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { current, history, recalculate } from '../controllers/burnout.js';
const router = Router(); router.use(requireUser); router.get('/current', current); router.get('/history', history); router.post('/recalculate', recalculate); export default router;
