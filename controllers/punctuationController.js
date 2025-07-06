const { Punctuation, PunctuationExercise } = require('../models/Punctuation');
const { Progress } = require('../models/Progress');
const UserProgress = require('../models/UserProgress');

const punctuationController = {
    // Get all punctuation rules with filtering
    getRules: async (req, res) => {
        try {
            const { language, punctuationMark, difficulty, page = 1, limit = 20 } = req.query;
            const filter = { isPublic: true };
            
            if (language) filter.language = language.toLowerCase();
            if (punctuationMark) filter.punctuationMark = punctuationMark;
            if (difficulty) filter.difficulty = difficulty;

            const skip = (page - 1) * limit;
            
            const rules = await Punctuation.find(filter)
                .populate('createdBy', 'username')
                .populate('relatedRules', 'title punctuationMark difficulty')
                .sort({ difficulty: 1, punctuationMark: 1, title: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Punctuation.countDocuments(filter);

            res.json({
                rules,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching punctuation rules', 
                error: error.message 
            });
        }
    },

    // Get specific punctuation rule by ID
    getRule: async (req, res) => {
        try {
            const rule = await Punctuation.findById(req.params.id)
                .populate('createdBy', 'username')
                .populate('relatedRules', 'title punctuationMark difficulty');

            if (!rule) {
                return res.status(404).json({ message: 'Punctuation rule not found' });
            }

            res.json(rule);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching punctuation rule', 
                error: error.message 
            });
        }
    },

    // Create new punctuation rule (admin/teacher only)
    createRule: async (req, res) => {
        try {
            const ruleData = {
                ...req.body,
                createdBy: req.user.id
            };

            const rule = new Punctuation(ruleData);
            await rule.save();

            res.status(201).json(rule);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error creating punctuation rule', 
                error: error.message 
            });
        }
    },

    // Get punctuation exercises for a specific rule
    getExercises: async (req, res) => {
        try {
            const { ruleId } = req.params;
            const { difficulty, type, limit = 10 } = req.query;
            
            const filter = { punctuationRule: ruleId, isPublic: true };
            if (difficulty) filter.difficulty = difficulty;
            if (type) filter.type = type;

            const exercises = await PunctuationExercise.find(filter)
                .populate('punctuationRule', 'title punctuationMark')
                .limit(parseInt(limit))
                .sort({ difficulty: 1, createdAt: -1 });

            res.json(exercises);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching punctuation exercises', 
                error: error.message 
            });
        }
    },

    // Get random punctuation exercises for practice
    getPracticeExercises: async (req, res) => {
        try {
            const { language, difficulty, punctuationMark, count = 10 } = req.query;
            const filter = { isPublic: true };
            
            if (language) filter.language = language.toLowerCase();
            if (difficulty) filter.difficulty = difficulty;

            // If punctuation mark is specified, find rules for that mark first
            if (punctuationMark) {
                const rules = await Punctuation.find({ 
                    punctuationMark, 
                    language: language?.toLowerCase() || 'english',
                    isPublic: true 
                }).select('_id');
                
                filter.punctuationRule = { $in: rules.map(r => r._id) };
            }

            const exercises = await PunctuationExercise.aggregate([
                { $match: filter },
                { $sample: { size: parseInt(count) } },
                {
                    $lookup: {
                        from: 'punctuations',
                        localField: 'punctuationRule',
                        foreignField: '_id',
                        as: 'rule'
                    }
                },
                { $unwind: '$rule' }
            ]);

            res.json(exercises);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching practice exercises', 
                error: error.message 
            });
        }
    },

    // Submit exercise answer and track progress
    submitExercise: async (req, res) => {
        try {
            const { exerciseId, answer, timeSpent } = req.body;
            const userId = req.user.id;

            const exercise = await PunctuationExercise.findById(exerciseId)
                .populate('punctuationRule');

            if (!exercise) {
                return res.status(404).json({ message: 'Exercise not found' });
            }

            // Check if answer is correct
            let isCorrect = false;
            let score = 0;

            if (exercise.type === 'multiple-choice') {
                const correctOption = exercise.options.find(opt => opt.isCorrect);
                isCorrect = answer === correctOption?.text;
            } else if (exercise.type === 'text-correction') {
                // For text correction, compare normalized text
                const normalizedAnswer = normalizeText(answer);
                const normalizedCorrect = normalizeText(exercise.correctText);
                isCorrect = normalizedAnswer === normalizedCorrect;
            } else {
                isCorrect = answer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
            }

            score = isCorrect ? exercise.points : 0;

            // Record progress
            const progress = new Progress({
                user: userId,
                category: 'punctuation',
                activityType: 'exercise',
                activityId: exerciseId,
                score: (score / exercise.points) * 100,
                maxScore: 100,
                timeSpent: timeSpent || 0,
                accuracy: isCorrect ? 100 : 0,
                correctAnswers: isCorrect ? 1 : 0,
                totalQuestions: 1,
                difficulty: exercise.difficulty,
                language: exercise.language,
                experienceGained: isCorrect ? exercise.points * 10 : exercise.points * 2
            });

            await progress.save();

            // Update user progress
            await updateUserPunctuationProgress(userId, exercise.language, {
                experienceGained: progress.experienceGained,
                timeSpent: timeSpent || 0,
                isCorrect,
                ruleId: exercise.punctuationRule._id
            });

            res.json({
                correct: isCorrect,
                score,
                explanation: exercise.explanation,
                correctAnswer: exercise.correctAnswer || exercise.correctText,
                experienceGained: progress.experienceGained
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error submitting exercise', 
                error: error.message 
            });
        }
    },

    // Get user's punctuation progress
    getUserProgress: async (req, res) => {
        try {
            const userId = req.user.id;
            const { language = 'english' } = req.query;

            const userProgress = await UserProgress.findOne({ 
                user: userId, 
                language: language.toLowerCase() 
            });

            if (!userProgress) {
                return res.json({
                    level: 1,
                    experience: 0,
                    rulesLearned: 0,
                    rulesMastered: 0,
                    averageAccuracy: 0,
                    totalTimeSpent: 0,
                    masteredRules: []
                });
            }

            res.json(userProgress.punctuationProgress);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching user progress', 
                error: error.message 
            });
        }
    },

    // Get punctuation marks
    getPunctuationMarks: async (req, res) => {
        try {
            const { language = 'english' } = req.query;
            
            const marks = await Punctuation.distinct('punctuationMark', { 
                language: language.toLowerCase(),
                isPublic: true 
            });

            res.json(marks);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching punctuation marks', 
                error: error.message 
            });
        }
    },

    // Text correction exercise
    getTextCorrectionExercise: async (req, res) => {
        try {
            const { language = 'english', difficulty = 'beginner' } = req.query;
            
            const exercise = await PunctuationExercise.findOne({
                type: 'text-correction',
                language: language.toLowerCase(),
                difficulty,
                isPublic: true
            }).populate('punctuationRule');

            if (!exercise) {
                return res.status(404).json({ message: 'No text correction exercise found' });
            }

            // Don't send the correct text to the client
            const { correctText, ...exerciseData } = exercise.toObject();
            
            res.json(exerciseData);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching text correction exercise', 
                error: error.message 
            });
        }
    }
};

// Helper function to normalize text for comparison
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'");
}

// Helper function to update user punctuation progress
async function updateUserPunctuationProgress(userId, language, data) {
    const { experienceGained, timeSpent, isCorrect, ruleId } = data;
    
    const userProgress = await UserProgress.findOneAndUpdate(
        { user: userId, language: language.toLowerCase() },
        {},
        { upsert: true, new: true }
    );

    // Update punctuation progress
    userProgress.punctuationProgress.experience += experienceGained;
    userProgress.punctuationProgress.totalTimeSpent += timeSpent;
    userProgress.punctuationProgress.lastActivity = new Date();

    // Calculate level based on experience
    const newLevel = Math.floor(userProgress.punctuationProgress.experience / 1000) + 1;
    userProgress.punctuationProgress.level = newLevel;

    // Update overall progress
    userProgress.totalExperience += experienceGained;
    userProgress.overallLevel = Math.floor(userProgress.totalExperience / 5000) + 1;

    if (isCorrect && ruleId) {
        // Check if rule is already mastered
        const existingRule = userProgress.punctuationProgress.masteredRules.find(
            r => r.ruleId.toString() === ruleId.toString()
        );

        if (!existingRule) {
            userProgress.punctuationProgress.masteredRules.push({
                ruleId,
                masteredAt: new Date(),
                accuracy: 100
            });
            userProgress.punctuationProgress.rulesMastered += 1;
        }
    }

    await userProgress.save();
}

module.exports = punctuationController;
