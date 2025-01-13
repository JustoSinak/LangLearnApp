// models/Quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    language: {
      type: String,
      required: [true, 'Language is required']
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true
    },
    questions: [{
      question: {
        type: String,
        required: true
      },
      options: [{
        type: String,
        required: true
      }],
      correctAnswer: {
        type: String,
        required: true
      },
      explanation: String
    }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    timeLimit: {
      type: Number, // in minutes
      default: 10
    },
    attempts: [{
      date: {
        type: Date,
        default: Date.now
      },
      score: {
        type: Number,
        required: true
      },
      timeSpent: Number // in seconds
    }]
  }, {
    timestamps: true
  });
  

// models/Question.js
const QuestionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    type: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'fill-blank', 'matching'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    options: [{
        text: String,
        isCorrect: Boolean
    }],
    explanation: String,
    points: {
        type: Number,
        default: 1
    }
});

// models/QuizAttempt.js
const QuizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        selectedOption: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = {
    Quiz: mongoose.model('Quiz', quizSchema),
    Question: mongoose.model('Question', QuestionSchema),
    QuizAttempt: mongoose.model('QuizAttempt', QuizAttemptSchema)
};
