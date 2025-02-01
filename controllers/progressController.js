const { Progress, Streak } = require('../models/Progress');
const mongoose = require('mongoose');

const progressController = {
    // Record activity progress
    recordProgress: async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { category, activityId, score, timeSpent, difficulty } = req.body;
            const userId = req.user.userId;

            // Record progress
            const progress = new Progress({
                user: userId,
                category,
                activityId,
                score,
                timeSpent,
                difficulty
            });
            await progress.save({ session });

            // Update streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let streak = await Streak.findOne({ user: userId });
            if (!streak) {
                streak = new Streak({ user: userId });
            }

            const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
            if (lastActivity) {
                lastActivity.setHours(0, 0, 0, 0);
                const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

                if (daysDiff === 1) {
                    // Continue streak
                    streak.currentStreak += 1;
                    streak.longestStreak = Math.max(streak.currentStreak, streak.longestStreak);
                } else if (daysDiff > 1) {
                    // Reset streak
                    streak.currentStreak = 1;
                }
            } else {
                // First activity
                streak.currentStreak = 1;
                streak.longestStreak = 1;
            }

            streak.lastActivityDate = today;
            await streak.save({ session });

            await session.commitTransaction();
            res.status(201).json({ progress, streak });
        } catch (error) {
            await session.abortTransaction();
            res.status(500).json({ message: 'Error recording progress', error: error.message });
        } finally {
            session.endSession();
        }
    },

    // Get user analytics
    getAnalytics: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { startDate, endDate, category } = req.query;

            const query = { user: userId };
            if (startDate && endDate) {
                query.completedAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            if (category) {
                query.category = category;
            }

            const analytics = await Progress.aggregate([
                { $match: query },
                { $group: {
                    _id: {
                        category: '$category',
                        difficulty: '$difficulty'
                    },
                    averageScore: { $avg: '$score' },
                    totalTimeSpent: { $sum: '$timeSpent' },
                    activitiesCompleted: { $sum: 1 }
                }},
                { $group: {
                    _id: '$_id.category',
                    byDifficulty: {
                        $push: {
                            difficulty: '$_id.difficulty',
                            averageScore: { $round: ['$averageScore', 2] },
                            totalTimeSpent: '$totalTimeSpent',
                            activitiesCompleted: '$activitiesCompleted'
                        }
                    },
                    overallScore: { $avg: '$averageScore' }
                }}
            ]);

            const streak = await Streak.findOne({ user: userId });

            res.json({
                analytics,
                streak: {
                    current: streak?.currentStreak || 0,
                    longest: streak?.longestStreak || 0
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching analytics', error: error.message });
        }
    }
};

module.exports = progressController;