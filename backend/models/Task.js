import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'medium' 
    },
    status: { 
      type: String, 
      enum: ['Pending', 'In-Progress', 'Completed'], 
      default: 'Pending' 
    },
    isOverwhelming: { type: Boolean, default: false },
    targetDate: { type: Date, default: null }, // Added for upcoming calendar
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    microSteps: [{
      title: { type: String, required: true },
      timeEstimate: { type: Number, default: 5 },
      isCompleted: { type: Boolean, default: false }
    }],
    estimatedTotalMinutes: { type: Number, default: 15 },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);