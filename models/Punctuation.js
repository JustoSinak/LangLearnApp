const mongoose = require('mongoose');

const punctuationRuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Punctuation rule title is required'],
    trim: true
  },
  punctuationMark: {
    type: String,
    required: [true, 'Punctuation mark is required'],
    enum: [
      'period', 'comma', 'semicolon', 'colon', 'question-mark', 
      'exclamation-mark', 'apostrophe', 'quotation-marks', 
      'parentheses', 'brackets', 'dash', 'hyphen', 'ellipsis'
    ]
  },
  description: {
    type: String,
    required: [true, 'Rule description is required']
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    lowercase: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Difficulty level is required'],
    index: true
  },
  rules: [{
    rule: {
      type: String,
      required: true
    },
    explanation: String,
    examples: [{
      correct: String,
      incorrect: String,
      context: String
    }]
  }],
  commonMistakes: [{
    mistake: String,
    correction: String,
    explanation: String
  }],
  relatedRules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Punctuation'
  }],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const punctuationExerciseSchema = new mongoose.Schema({
  punctuationRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Punctuation',
    required: true
  },
  type: {
    type: String,
    enum: ['text-correction', 'multiple-choice', 'insertion', 'identification'],
    required: [true, 'Exercise type is required']
  },
  text: {
    type: String,
    required: [true, 'Exercise text is required']
  },
  correctText: String,
  question: String,
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  explanation: String,
  hints: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  timeLimit: Number, // in seconds
  language: {
    type: String,
    required: true,
    lowercase: true
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
punctuationRuleSchema.index({ language: 1, punctuationMark: 1, difficulty: 1 });
punctuationExerciseSchema.index({ punctuationRule: 1, difficulty: 1 });

const Punctuation = mongoose.model('Punctuation', punctuationRuleSchema);
const PunctuationExercise = mongoose.model('PunctuationExercise', punctuationExerciseSchema);

module.exports = {
  Punctuation,
  PunctuationExercise
};
