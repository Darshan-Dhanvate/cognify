import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const schema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  timezone: { type: String, default: 'UTC' },
  journalAnalysisEnabled: { type: Boolean, default: true },
  cognitiveProfile: { burnoutThreshold: { type: Number, default: 75 } },
}, { timestamps: true });

schema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
schema.methods.matchesPassword = function matchesPassword(value) { return bcrypt.compare(value, this.password); };
export default mongoose.model('User', schema);
