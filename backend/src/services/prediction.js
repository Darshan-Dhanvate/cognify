import axios from 'axios';
import BurnoutPrediction from '../models/BurnoutPrediction.js';
import { buildFeatures } from './features.js';
import { offerForPrediction } from './interventions.js';

export async function predictForUser(userId, trigger = 'manual') {
  const features = await buildFeatures(userId);
  const response = await axios.post(`${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8081'}/predict`, { features }, { timeout: 60000 });
  const result = response.data;
  const saved = await BurnoutPrediction.create({ user: userId, modelVersion: result.modelVersion, featureSchemaVersion: '1.0', riskScore: result.riskScore, riskLevel: result.riskLevel, confidence: result.confidence || null, features, topFactors: result.topFactors || [], trigger });
  await offerForPrediction(saved);
  return saved;
}