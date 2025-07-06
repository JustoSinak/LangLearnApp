const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    language: {
        type: String,
        required: true,
        lowercase: true
    },
    overallLevel: {
        type: Number,
        default: 1,
        min: 1
    },
    totalExperience: {
        type: Number,
        default: 0,
        min: 0
    },
    vocabularyProgress: {
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        wordsLearned: { type: Number, default: 0 },
        wordsMastered: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        totalTimeSpent: { type: Number, default: 0 },
        lastActivity: Date,
        masteredWords: [{
            wordId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Vocabulary'
            },
            masteredAt: {
                type: Date,
                default: Date.now
            },
            reviewCount: {
                type: Number,
                default: 0
            },
            accuracy: {
                type: Number,
                default: 0
            }
        }]
    },
    grammarProgress: {
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        rulesLearned: { type: Number, default: 0 },
        rulesMastered: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        totalTimeSpent: { type: Number, default: 0 },
        lastActivity: Date,
        masteredRules: [{
            ruleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Grammar'
            },
            masteredAt: {
                type: Date,
                default: Date.now
            },
            accuracy: {
                type: Number,
                default: 0
            }
        }]
    },
    punctuationProgress: {
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        rulesLearned: { type: Number, default: 0 },
        rulesMastered: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        totalTimeSpent: { type: Number, default: 0 },
        lastActivity: Date,
        masteredRules: [{
            ruleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Punctuation'
            },
            masteredAt: {
                type: Date,
                default: Date.now
            },
            accuracy: {
                type: Number,
                default: 0
            }
        }]
    },
    quizProgress: {
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        quizzesCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        bestScore: { type: Number, default: 0 },
        totalTimeSpent: { type: Number, default: 0 },
        lastActivity: Date,
        recentResults: [{
            quizId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Quiz'
            },
            score: Number,
            maxScore: Number,
            timeSpent: Number,
            completedAt: {
                type: Date,
                default: Date.now
            },
            difficulty: String
        }]
    },
    flashcardProgress: {
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 },
        cardsReviewed: { type: Number, default: 0 },
        cardsMastered: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        totalTimeSpent: { type: Number, default: 0 },
        lastActivity: Date,
        deckProgress: [{
            deckId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FlashcardDeck'
            },
            cardsTotal: Number,
            cardsNew: Number,
            cardsLearning: Number,
            cardsReview: Number,
            cardsMastered: Number,
            lastReviewed: Date
        }]
    },
    weeklyStats: {
        currentWeek: {
            startDate: Date,
            endDate: Date,
            timeSpent: { type: Number, default: 0 },
            activitiesCompleted: { type: Number, default: 0 },
            experienceGained: { type: Number, default: 0 },
            streak: { type: Number, default: 0 }
        },
        previousWeeks: [{
            startDate: Date,
            endDate: Date,
            timeSpent: Number,
            activitiesCompleted: Number,
            experienceGained: Number,
            averageAccuracy: Number
        }]
    },
    monthlyStats: {
        currentMonth: {
            month: Number,
            year: Number,
            timeSpent: { type: Number, default: 0 },
            activitiesCompleted: { type: Number, default: 0 },
            experienceGained: { type: Number, default: 0 },
            daysActive: { type: Number, default: 0 }
        },
        previousMonths: [{
            month: Number,
            year: Number,
            timeSpent: Number,
            activitiesCompleted: Number,
            experienceGained: Number,
            daysActive: Number,
            averageAccuracy: Number
        }]
    },
    preferences: {
        dailyGoal: { type: Number, default: 30 }, // minutes
        reminderTime: String,
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        },
        focusAreas: [{
            type: String,
            enum: ['vocabulary', 'grammar', 'punctuation', 'listening', 'speaking']
        }]
    }
}, {
    timestamps: true
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
module.exports = UserProgress;