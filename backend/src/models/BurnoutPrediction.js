import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  modelVersion: String, featureSchemaVersion: String, riskScore: Number, riskLevel: String, confidence: Number,
  features: { type: mongoose.Schema.Types.Mixed, required: true }, topFactors: [mongoose.Schema.Types.Mixed], trigger: String,
}, { timestamps: true });
export default mongoose.model('BurnoutPrediction', schema);
