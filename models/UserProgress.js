const userProgressSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vocabularyProgress: [{
      wordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vocabulary'
      },
      mastered: {
        type: Boolean,
        default: false
      },
      reviewCount: {
        type: Number,
        default: 0
      },
      lastReviewed: Date
    }],
    quizResults: [{
      quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
      },
      score: Number,
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    flashcardProgress: [{
      flashcardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flashcard'
      },
      confidence: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      nextReviewDate: Date
    }]
  });
  const UserProgress = mongoose.model('UserProgress', userProgressSchema);
  module.exports= {UserProgress};