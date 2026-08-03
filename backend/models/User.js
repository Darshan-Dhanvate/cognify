import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  energyState: { 
    type: String, 
    enum: ['High', 'Medium', 'Low', 'Burnout'], 
    default: 'Medium' 
  },
  currentStreak: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;