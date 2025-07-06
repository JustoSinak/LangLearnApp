const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
    dateOfBirth: Date,
    country: String,
    timezone: String
  },
  learningPreferences: {
    targetLanguages: [{
      language: String,
      proficiencyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
      }
    }],
    primaryLanguage: {
      type: String,
      default: 'english'
    },
    dailyGoal: {
      type: Number,
      default: 30, // minutes
      min: [5, 'Daily goal must be at least 5 minutes'],
      max: [480, 'Daily goal cannot exceed 8 hours']
    },
    studyReminders: {
      enabled: { type: Boolean, default: true },
      time: { type: String, default: '19:00' },
      frequency: {
        type: String,
        enum: ['daily', 'weekdays', 'custom'],
        default: 'daily'
      }
    }
  },
  progress: {
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    lessonsCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    vocabularyMastered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivity: Date
    },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['streak', 'vocabulary', 'grammar', 'quiz', 'flashcard', 'punctuation', 'level']
    },
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String
  }],
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: { type: String, default: 'en' }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: false }
  },
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
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