import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  analysis: { stressScore: Number, sentimentPolarity: Number, detectedDistortions: [String], moodState: String, suggestedReframing: String },
}, { timestamps: true });
export default mongoose.model('Journal', schema);
