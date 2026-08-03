import mongoose from 'mongoose';

const microStepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  timeEstimate: { type: Number, default: 5 } // 5-minute rule
});

const taskSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  isOverwhelming: { 
    type: Boolean, 
    default: false 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'], 
    default: 'Pending' 
  },
  microSteps: [microStepSchema] // AI will populate this array
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;