import mongoose from 'mongoose';

const microStepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  timeEstimate: { type: Number, default: 5 }, 
  isCompleted: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    default: ''
  },
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
  isOverwhelming: { 
    type: Boolean, 
    default: false 
  },
  
  // Date-wise tracking for the calendar/timeline UI
  dueDate: { 
    type: Date,
    default: Date.now
  },
  
  // Advanced Relational Mapping
  parentTask: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    default: null 
  },
  
  // AI generated array of manageable chunks
  microSteps: [microStepSchema],
  
  estimatedTotalMinutes: { 
    type: Number, 
    default: 15 
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;