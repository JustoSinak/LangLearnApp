const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true }, // vocabulary, grammar, quiz
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    timeSpent: { type: Number, required: true }, // in seconds
    completedAt: { type: Date, default: Date.now },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
});

const streakSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
    streakUpdatedAt: { type: Date, default: Date.now }
});

module.exports = {
    Progress: mongoose.model('Progress', progressSchema),
    Streak: mongoose.model('Streak', streakSchema)
};