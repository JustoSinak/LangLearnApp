const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true,
    index: true
  },
  translation: {
    type: String,
    required: [true, 'Translation is required'],
    trim: true
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    lowercase: true
  },
  targetLanguage: {
    type: String,
    required: [true, 'Target language is required'],
    lowercase: true
  },
  partOfSpeech: {
    type: String,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection', 'article', 'determiner'],
    required: [true, 'Part of speech is required']
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Difficulty level is required'],
    index: true
  },
  examples: [{
    sentence: {
      type: String,
      required: true
    },
    translation: String,
    context: String
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true
  },
  subcategory: String,
  pronunciation: {
    phonetic: String,
    audioUrl: String
  },
  synonyms: [String],
  antonyms: [String],
  relatedWords: [String],
  frequency: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [String],
  imageUrl: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
vocabularySchema.index({ word: 1, language: 1 });
vocabularySchema.index({ category: 1, difficulty: 1 });
vocabularySchema.index({ language: 1, difficulty: 1 });

const Vocabulary = mongoose.model('Vocabulary', vocabularySchema);
module.exports = Vocabulary;