const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['vocabulary', 'grammar', 'quiz', 'flashcard', 'punctuation']
    },
    activityType: {
        type: String,
        required: true,
        enum: ['lesson', 'exercise', 'quiz', 'flashcard-review', 'practice']
    },
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    maxScore: {
        type: Number,
        default: 100
    },
    timeSpent: {
        type: Number,
        required: true,
        min: 0 // in seconds
    },
    accuracy: {
        type: Number,
        min: 0,
        max: 100
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    language: {
        type: String,
        required: true,
        lowercase: true
    },
    experienceGained: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        hintsUsed: { type: Number, default: 0 },
        attemptsCount: { type: Number, default: 1 },
        deviceType: String,
        sessionId: String
    }
}, {
    timestamps: true
});

const streakSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    currentStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    longestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    lastActivityDate: {
        type: Date
    },
    streakUpdatedAt: {
        type: Date,
        default: Date.now
    },
    streakHistory: [{
        date: Date,
        activitiesCompleted: Number,
        timeSpent: Number
    }],
    weeklyGoal: {
        target: { type: Number, default: 7 }, // days per week
        achieved: { type: Number, default: 0 }
    },
    monthlyGoal: {
        target: { type: Number, default: 30 }, // days per month
        achieved: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

const achievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['streak', 'vocabulary', 'grammar', 'quiz', 'flashcard', 'punctuation', 'level', 'time', 'accuracy']
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    icon: String,
    category: String,
    difficulty: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum']
    },
    points: {
        type: Number,
        default: 0
    },
    progress: {
        current: { type: Number, default: 0 },
        target: { type: Number, required: true }
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    isVisible: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
progressSchema.index({ user: 1, category: 1, completedAt: -1 });
progressSchema.index({ user: 1, completedAt: -1 });
streakSchema.index({ user: 1 });
achievementSchema.index({ user: 1, type: 1 });

module.exports = {
    Progress: mongoose.model('Progress', progressSchema),
    Streak: mongoose.model('Streak', streakSchema),
    Achievement: mongoose.model('Achievement', achievementSchema)
};