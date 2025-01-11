const mongoose = require('mongoose');
const vocabularySchema = new mongoose.Schema({
    word: { type: String, required: true },
    definition: { type: String, required: true },
    examples: [String],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    category: String
  });
  
  module.exports = mongoose.model(
    'Vocabulary', 
    vocabularySchema
);