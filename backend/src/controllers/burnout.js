import BurnoutPrediction from '../models/BurnoutPrediction.js';
import { predictForUser } from '../services/prediction.js';

export async function current(req, res) { const latest = await BurnoutPrediction.findOne({ user: req.user._id }).sort({ createdAt: -1 }).lean(); res.json(latest || { predictionStatus: 'insufficient_data' }); }
export async function history(req, res) { const days = Math.min(Number(req.query.days) || 30, 90); res.json(await BurnoutPrediction.find({ user: req.user._id, createdAt: { $gte: new Date(Date.now() - days * 86400000) } }).sort({ createdAt: 1 }).lean()); }
export async function recalculate(req, res) { try { res.status(201).json(await predictForUser(req.user._id, req.body.trigger || 'manual')); } catch (e) { res.status(503).json({ message: 'Prediction service unavailable', detail: e.message }); } }
