import Journal from '../models/Journal.js';
import axios from 'axios';
import { predictForUser } from '../services/prediction.js';

export async function listJournals(req, res) { res.json(await Journal.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()); }

export async function createJournal(req, res) {
  const content = req.body.content?.trim();
  if (!content) return res.status(400).json({ message: 'Journal content is required' });
  let analysis = null;
  if (req.user.journalAnalysisEnabled !== false) try {
    const response = await axios.post(`${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8081'}/journal/analyze`, { content }, { timeout: 8000 });
    analysis = response.data;
  } catch (error) {
    console.warn(`Journal NLP skipped: ${error.message}`);
  }
  const journal = await Journal.create({ user: req.user._id, content, analysis });
  try { await predictForUser(req.user._id, 'journal_submitted'); } catch (error) { console.warn(`Prediction skipped (journal_submitted): ${error.message}`); }
  res.status(201).json(journal);
}

export async function removeJournal(req, res) { const journal = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id }); if (!journal) return res.status(404).json({ message: 'Journal not found' }); let predictionUpdated = false; try { await predictForUser(req.user._id, 'journal_deleted'); predictionUpdated = true; } catch (error) { console.warn(`Prediction skipped (journal_deleted): ${error.message}`); } res.json({ message: 'Journal deleted', predictionUpdated }); }
