import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  category: { type: String, default: 'general' },
  interval: { type: Number, default: 1 }, // Days until next review
  repetitions: { type: Number, default: 0 },
  difficulty: { type: Number, default: 3 }, // 1-5 scale
  nextReview: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Flashcard', flashcardSchema);