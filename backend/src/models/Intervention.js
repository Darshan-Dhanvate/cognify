import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prediction: { type: mongoose.Schema.Types.ObjectId, ref: 'BurnoutPrediction', required: true },
  type: { type: String, enum: ['task_decomposition', 'schedule_review', 'focus_mode'], required: true },
  status: { type: String, enum: ['offered', 'accepted', 'rejected', 'dismissed', 'completed', 'expired'], default: 'offered' },
  triggerRisk: Number, recommendation: mongoose.Schema.Types.Mixed, userResponseAt: Date,
  cooldownUntil: Date, completedAt: Date, riskAfter: Number,
  outcome: { type: String, enum: ['improved', 'unchanged', 'worsened', 'unknown'], default: 'unknown' },
  outcomeNote: String,
}, { timestamps: true });
export default mongoose.model('Intervention', schema);
