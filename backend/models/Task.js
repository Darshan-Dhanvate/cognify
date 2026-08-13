import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String },
    
    taskType: { 
      type: String, 
      enum: ['deep-work', 'quick-task', 'strict-event'], 
      default: 'deep-work' 
    },
    
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
    isOverwhelming: { type: Boolean, default: false },
    
    scheduledDate: { type: Date, default: null }, 
    dueDate: { type: Date, default: null },       
    
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    
    microSteps: [{
      title: { type: String, required: true },
      timeEstimate: { type: Number, default: 5 },
      isCompleted: { type: Boolean, default: false }
    }],
    
    estimatedTotalMinutes: { type: Number, default: 15 },
    
    // 🧠 ML Telemetry Data
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    pushCount: { type: Number, default: 0 } // Tracks how many times scheduledDate is delayed
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);