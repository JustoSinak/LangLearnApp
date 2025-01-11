const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  progress: {
    vocabularyScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    flashcardsCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model(
    'User', 
    userSchema
);