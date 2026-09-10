import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true }, description: String,
  taskType: { type: String, enum: ['deep-work', 'quick-task', 'strict-event'], default: 'deep-work' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
  isOverwhelming: { type: Boolean, default: false }, scheduledDate: Date, dueDate: Date,
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  microSteps: [{ title: { type: String, required: true }, timeEstimate: { type: Number, default: 5 }, isCompleted: { type: Boolean, default: false } }],
  estimatedTotalMinutes: { type: Number, default: 15 }, startedAt: Date, completedAt: Date,
}, { timestamps: true });
export default mongoose.model('Task', schema);
