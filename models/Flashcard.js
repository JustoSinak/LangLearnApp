const mongoose = require('mongoose');
const flashcardSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vocabulary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
      required: true
    },
    deck: {
      type: String,
      required: [true, 'Deck name is required'],
      trim: true
    },
    front: {
      type: String,
      required: [true, 'Front content is required']
    },
    back: {
      type: String,
      required: [true, 'Back content is required']
    },
    notes: String,
    reviewStatus: {
      type: String,
      enum: ['new', 'learning', 'review', 'mastered'],
      default: 'new'
    },
    nextReviewDate: {
      type: Date,
      default: Date.now
    },
    reviewHistory: [{
      date: {
        type: Date,
        default: Date.now
      },
      performance: {
        type: String,
        enum: ['again', 'hard', 'good', 'easy'],
        required: true
      },
      timeSpent: Number // in seconds
    }]
  }, {
    timestamps: true
  });
  const Flashcards = model('Flashcards', flashcardSchema);
module.exports={Flashcards};