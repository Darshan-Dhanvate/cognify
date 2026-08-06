import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  cognitiveProfile: {
    burnoutThreshold: { type: Number, default: 75 },
    preferredFocusTime: { type: Number, default: 25 }, 
  }
}, { timestamps: true });

// Pre-save hook to automatically hash passwords (Modern Async Version)
userSchema.pre('save', async function() {
  // If the password hasn't been changed, exit the hook immediately
  if (!this.isModified('password')) return;
  
  // Otherwise, securely hash it
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare passwords during login
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;