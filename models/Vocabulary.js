import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
  word: { type: String, required: true },
  translation: { type: String, required: true },
  language: { type: String, required: true },
  examples: [String],
  difficulty: { type: Number, min: 1, max: 5, default: 3 },
  nextReview: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Vocabulary', vocabularySchema);