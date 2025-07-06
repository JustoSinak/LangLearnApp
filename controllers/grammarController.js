const { Grammar, GrammarExercise } = require('../models/Grammar');
const { Progress } = require('../models/Progress');
const UserProgress = require('../models/UserProgress');

const grammarController = {
    // Get all grammar rules with filtering
    getRules: async (req, res) => {
        try {
            const { language, category, difficulty, page = 1, limit = 20 } = req.query;
            const filter = { isPublic: true };
            
            if (language) filter.language = language.toLowerCase();
            if (category) filter.category = category;
            if (difficulty) filter.difficulty = difficulty;

            const skip = (page - 1) * limit;
            
            const rules = await Grammar.find(filter)
                .populate('createdBy', 'username')
                .populate('relatedRules', 'title category difficulty')
                .sort({ difficulty: 1, category: 1, title: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Grammar.countDocuments(filter);

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
                message: 'Error fetching grammar rules', 
                error: error.message 
            });
        }
    },

    // Get specific grammar rule by ID
    getRule: async (req, res) => {
        try {
            const rule = await Grammar.findById(req.params.id)
                .populate('createdBy', 'username')
                .populate('relatedRules', 'title category difficulty');

            if (!rule) {
                return res.status(404).json({ message: 'Grammar rule not found' });
            }

            res.json(rule);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching grammar rule', 
                error: error.message 
            });
        }
    },

    // Create new grammar rule (admin/teacher only)
    createRule: async (req, res) => {
        try {
            const ruleData = {
                ...req.body,
                createdBy: req.user.id
            };

            const rule = new Grammar(ruleData);
            await rule.save();

            res.status(201).json(rule);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error creating grammar rule', 
                error: error.message 
            });
        }
    },

    // Get grammar exercises for a specific rule
    getExercises: async (req, res) => {
        try {
            const { ruleId } = req.params;
            const { difficulty, type, limit = 10 } = req.query;
            
            const filter = { grammarRule: ruleId, isPublic: true };
            if (difficulty) filter.difficulty = difficulty;
            if (type) filter.type = type;

            const exercises = await GrammarExercise.find(filter)
                .populate('grammarRule', 'title category')
                .limit(parseInt(limit))
                .sort({ difficulty: 1, createdAt: -1 });

            res.json(exercises);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching grammar exercises', 
                error: error.message 
            });
        }
    },

    // Get random grammar exercises for practice
    getPracticeExercises: async (req, res) => {
        try {
            const { language, difficulty, category, count = 10 } = req.query;
            const filter = { isPublic: true };
            
            if (language) filter.language = language.toLowerCase();
            if (difficulty) filter.difficulty = difficulty;

            // If category is specified, find rules in that category first
            if (category) {
                const rules = await Grammar.find({ 
                    category, 
                    language: language?.toLowerCase() || 'english',
                    isPublic: true 
                }).select('_id');
                
                filter.grammarRule = { $in: rules.map(r => r._id) };
            }

            const exercises = await GrammarExercise.aggregate([
                { $match: filter },
                { $sample: { size: parseInt(count) } },
                {
                    $lookup: {
                        from: 'grammars',
                        localField: 'grammarRule',
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

            const exercise = await GrammarExercise.findById(exerciseId)
                .populate('grammarRule');

            if (!exercise) {
                return res.status(404).json({ message: 'Exercise not found' });
            }

            // Check if answer is correct
            let isCorrect = false;
            let score = 0;

            if (exercise.type === 'multiple-choice') {
                const correctOption = exercise.options.find(opt => opt.isCorrect);
                isCorrect = answer === correctOption?.text;
            } else {
                isCorrect = answer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
            }

            score = isCorrect ? exercise.points : 0;

            // Record progress
            const progress = new Progress({
                user: userId,
                category: 'grammar',
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
            await updateUserGrammarProgress(userId, exercise.language, {
                experienceGained: progress.experienceGained,
                timeSpent: timeSpent || 0,
                isCorrect,
                ruleId: exercise.grammarRule._id
            });

            res.json({
                correct: isCorrect,
                score,
                explanation: exercise.explanation,
                correctAnswer: exercise.correctAnswer,
                experienceGained: progress.experienceGained
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error submitting exercise', 
                error: error.message 
            });
        }
    },

    // Get user's grammar progress
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

            res.json(userProgress.grammarProgress);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching user progress', 
                error: error.message 
            });
        }
    },

    // Get grammar categories
    getCategories: async (req, res) => {
        try {
            const { language = 'english' } = req.query;
            
            const categories = await Grammar.distinct('category', { 
                language: language.toLowerCase(),
                isPublic: true 
            });

            res.json(categories);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error fetching categories', 
                error: error.message 
            });
        }
    }
};

// Helper function to update user grammar progress
async function updateUserGrammarProgress(userId, language, data) {
    const { experienceGained, timeSpent, isCorrect, ruleId } = data;
    
    const userProgress = await UserProgress.findOneAndUpdate(
        { user: userId, language: language.toLowerCase() },
        {},
        { upsert: true, new: true }
    );

    // Update grammar progress
    userProgress.grammarProgress.experience += experienceGained;
    userProgress.grammarProgress.totalTimeSpent += timeSpent;
    userProgress.grammarProgress.lastActivity = new Date();

    // Calculate level based on experience
    const newLevel = Math.floor(userProgress.grammarProgress.experience / 1000) + 1;
    userProgress.grammarProgress.level = newLevel;

    // Update overall progress
    userProgress.totalExperience += experienceGained;
    userProgress.overallLevel = Math.floor(userProgress.totalExperience / 5000) + 1;

    if (isCorrect && ruleId) {
        // Check if rule is already mastered
        const existingRule = userProgress.grammarProgress.masteredRules.find(
            r => r.ruleId.toString() === ruleId.toString()
        );

        if (!existingRule) {
            userProgress.grammarProgress.masteredRules.push({
                ruleId,
                masteredAt: new Date(),
                accuracy: 100
            });
            userProgress.grammarProgress.rulesMastered += 1;
        }
    }

    await userProgress.save();
}

module.exports = grammarController;
