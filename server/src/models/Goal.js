import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  target: { type: Number, required: true, min: 1 },
  saved: { type: Number, default: 0, min: 0 },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
