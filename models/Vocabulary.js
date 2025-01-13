const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const vocabularySchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    trim: true
  },
  translation: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    required: true
  },
  partOfSpeech: {
    type: String,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  example: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

const Vocabulary = model('Vocabulary', vocabularySchema);
module.exports={Vocabulary};