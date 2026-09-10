import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settings.js';
const router = Router(); router.use(requireUser); router.get('/', getSettings); router.put('/', updateSettings); export default router;
