import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { listJournals, createJournal, removeJournal } from '../controllers/journals.js';
const router = Router(); router.use(requireUser); router.get('/', listJournals); router.post('/', createJournal); router.delete('/:id', removeJournal); export default router;
