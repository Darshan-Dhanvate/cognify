import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String },
    
    // NEW: Categorizing the psychological weight of the task
    taskType: { 
      type: String, 
      enum: ['deep-work', 'quick-task', 'strict-event'], 
      default: 'deep-work' 
    },
    
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
    isOverwhelming: { type: Boolean, default: false },
    
    // NEW: Separating Intentions from Deadlines
    scheduledDate: { type: Date, default: null }, // The day you PLAN to do it
    dueDate: { type: Date, default: null },       // The hard deadline (if applicable)
    
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    
    // NEW: Explicit blocking dependencies
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