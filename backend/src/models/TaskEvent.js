import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  eventType: { type: String, required: true, index: true }, previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed, metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
export default mongoose.model('TaskEvent', schema);
