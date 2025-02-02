import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['vocabulary', 'grammar', 'mixed'],
    required: true
  },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  details: [{
    question: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quiz', quizSchema);