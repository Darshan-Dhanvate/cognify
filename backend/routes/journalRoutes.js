import express from 'express';
import { createJournalEntry, getUserJournals, deleteJournalEntry } from '../controllers/journalController.js';
import { protect } from '../middleware/authMiddleware.js'; // Ensure your auth middleware is exported accordingly

const router = express.Router();

// Apply the JWT protection middleware to all routes in this file
router.use(protect);

// ---------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------

router.route('/')
    // POST /api/journal -> Submits raw text, hits Python ML, saves to DB
    .post(createJournalEntry)
    // GET /api/journal -> Retrieves the user's historical journal entries
    .get(getUserJournals);

// NEW: Added DELETE route for clearing journal cards from the UI
router.route('/:id')
    .delete(deleteJournalEntry);

export default router;