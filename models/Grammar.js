import mongoose from 'mongoose';

const grammarSchema = new mongoose.Schema({
  rule: { type: String, required: true },
  examples: [String],
  exerciseType: { 
    type: String,
    enum: ['multiple-choice', 'fill-blank', 'sentence-correction'],
    default: 'multiple-choice'
  },
  language: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Grammar', grammarSchema);