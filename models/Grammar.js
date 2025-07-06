const mongoose = require('mongoose');

const grammarRuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Grammar rule title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Grammar rule description is required']
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Grammar category is required'],
    enum: [
      'tenses', 'articles', 'prepositions', 'pronouns', 'adjectives', 
      'adverbs', 'conjunctions', 'sentence-structure', 'conditionals',
      'passive-voice', 'reported-speech', 'modals', 'gerunds-infinitives'
    ]
  },
  subcategory: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Difficulty level is required'],
    index: true
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required']
  },
  examples: [{
    correct: {
      type: String,
      required: true
    },
    incorrect: String,
    explanation: String,
    context: String
  }],
  commonMistakes: [{
    mistake: String,
    correction: String,
    explanation: String
  }],
  relatedRules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grammar'
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

const grammarExerciseSchema = new mongoose.Schema({
  grammarRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grammar',
    required: true
  },
  type: {
    type: String,
    enum: ['fill-blank', 'multiple-choice', 'sentence-correction', 'transformation', 'matching'],
    required: [true, 'Exercise type is required']
  },
  question: {
    type: String,
    required: [true, 'Question is required']
  },
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
grammarRuleSchema.index({ language: 1, category: 1, difficulty: 1 });
grammarExerciseSchema.index({ grammarRule: 1, difficulty: 1 });

const Grammar = mongoose.model('Grammar', grammarRuleSchema);
const GrammarExercise = mongoose.model('GrammarExercise', grammarExerciseSchema);

module.exports = {
  Grammar,
  GrammarExercise
};
