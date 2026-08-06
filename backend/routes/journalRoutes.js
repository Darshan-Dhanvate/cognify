import express from 'express';
import { createJournal, getJournals } from '../controllers/journalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply the protect middleware to secure both endpoints
router.route('/')
  .post(protect, createJournal)
  .get(protect, getJournals);

export default router;