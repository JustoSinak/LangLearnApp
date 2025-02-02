// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   progress: {
//     vocabularyScore: { type: Number, default: 0 },
//     grammarScore: { type: Number, default: 0 },
//     flashcardsCompleted: { type: Number, default: 0 },
//     quizzesCompleted: { type: Number, default: 0 }
//   },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model(
//     'User', 
//     userSchema
// );


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  learningPreferences: {
    targetLanguage: String,
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    dailyGoal: {
      type: Number,
      default: 30 // minutes
    }
  },
  progress: {
    lessonsCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    vocabularyMastered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Word' }],
    streak: {
      count: { type: Number, default: 0 },
      lastActivity: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password validity
userSchema.methods.isValidPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;