const Quiz = require('../models/Quiz');
const { Progress } = require('../models/Progress');
const UserProgress = require('../models/UserProgress');
const Vocabulary = require('../models/Vocabulary');
const { Grammar, GrammarExercise } = require('../models/Grammar');
const { Punctuation, PunctuationExercise } = require('../models/Punctuation');

const quizController = {
    // Get all available quizzes with filtering
    getQuizzes: async (req, res) => {
        try {
            const {
                language,
                difficulty,
                category,
                type,
                page = 1,
                limit = 20
            } = req.query;

            const filter = { isPublic: true };

            if (language) filter.language = language.toLowerCase();
            if (difficulty) filter.difficulty = difficulty;
            if (category) filter.category = category;
            if (type) filter.type = type;

            const skip = (page - 1) * limit;

            const quizzes = await Quiz.find(filter)
                .populate('createdBy', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-questions.correctAnswer -questions.explanation');

            const total = await Quiz.countDocuments(filter);

            res.json({
                quizzes,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching quizzes',
                error: error.message
            });
        }
    },

    // Get specific quiz by ID
    getQuiz: async (req, res) => {
        try {
            const { quizId } = req.params;

            const quiz = await Quiz.findById(quizId)
                .populate('createdBy', 'username')
                .select('-questions.correctAnswer -questions.explanation');

            if (!quiz) {
                return res.status(404).json({ message: 'Quiz not found' });
            }

            res.json(quiz);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching quiz',
                error: error.message
            });
        }
    },

    // Generate dynamic quiz from various sources
    generateQuiz: async (req, res) => {
        try {
            const {
                language = 'english',
                targetLanguage = 'spanish',
                difficulty,
                category,
                type = 'mixed', // vocabulary, grammar, punctuation, mixed
                questionCount = 10,
                timeLimit,
                adaptiveDifficulty = false
            } = req.query;

            const userId = req.user.userId;
            let questions = [];

            // Get user's progress to adapt difficulty
            let userLevel = 'beginner';
            if (adaptiveDifficulty === 'true') {
                const userProgress = await UserProgress.findOne({
                    user: userId,
                    language: targetLanguage.toLowerCase()
                });

                if (userProgress) {
                    const avgLevel = Math.floor(userProgress.overallLevel / 3);
                    userLevel = avgLevel <= 1 ? 'beginner' : avgLevel <= 2 ? 'intermediate' : 'advanced';
                }
            }

            const finalDifficulty = difficulty || userLevel;
            const questionsPerType = Math.ceil(questionCount / (type === 'mixed' ? 3 : 1));

            // Generate vocabulary questions
            if (type === 'vocabulary' || type === 'mixed') {
                const vocabQuestions = await generateVocabularyQuestions(
                    language,
                    targetLanguage,
                    finalDifficulty,
                    category,
                    questionsPerType
                );
                questions.push(...vocabQuestions);
            }

            // Generate grammar questions
            if (type === 'grammar' || type === 'mixed') {
                const grammarQuestions = await generateGrammarQuestions(
                    language,
                    finalDifficulty,
                    category,
                    questionsPerType
                );
                questions.push(...grammarQuestions);
            }

            // Generate punctuation questions
            if (type === 'punctuation' || type === 'mixed') {
                const punctuationQuestions = await generatePunctuationQuestions(
                    language,
                    finalDifficulty,
                    questionsPerType
                );
                questions.push(...punctuationQuestions);
            }

            // Shuffle questions and limit to requested count
            questions = shuffleArray(questions).slice(0, questionCount);

            if (questions.length === 0) {
                return res.status(404).json({
                    message: 'No questions available for the specified criteria'
                });
            }

            // Create quiz object
            const quiz = {
                id: `dynamic_quiz_${Date.now()}`,
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Quiz`,
                description: `Test your ${targetLanguage} knowledge`,
                language,
                targetLanguage,
                difficulty: finalDifficulty,
                category: category || 'mixed',
                type,
                timeLimit: timeLimit ? parseInt(timeLimit) : null,
                totalQuestions: questions.length,
                questions: questions.map((q, index) => ({
                    id: index + 1,
                    ...q,
                    // Remove correct answer and explanation from client response
                    correctAnswer: undefined,
                    explanation: undefined
                })),
                createdAt: new Date(),
                isAdaptive: adaptiveDifficulty === 'true'
            };

            res.json(quiz);
        } catch (error) {
            res.status(500).json({
                message: 'Error generating quiz',
                error: error.message
            });
        }
    },

    // Submit quiz answers and calculate results
    submitQuiz: async (req, res) => {
        try {
            const {
                quizId,
                answers,
                timeSpent,
                quizType = 'dynamic',
                quizData
            } = req.body;

            const userId = req.user.userId;
            let quiz;
            let questions;

            if (quizType === 'dynamic') {
                // For dynamic quizzes, we need to regenerate the questions with answers
                questions = await regenerateQuestionsWithAnswers(quizData);
            } else {
                // For stored quizzes
                quiz = await Quiz.findById(quizId);
                if (!quiz) {
                    return res.status(404).json({ message: 'Quiz not found' });
                }
                questions = quiz.questions;
            }

            // Calculate results
            let correctCount = 0;
            let totalPoints = 0;
            const maxPoints = questions.length * 10; // 10 points per question

            const results = questions.map((question, index) => {
                const userAnswer = answers[index];
                let isCorrect = false;
                let points = 0;

                // Check answer based on question type
                if (question.type === 'multiple-choice') {
                    const correctOption = question.options.find(opt => opt.isCorrect);
                    isCorrect = userAnswer === correctOption?.text;
                } else if (question.type === 'true-false') {
                    isCorrect = userAnswer === question.correctAnswer;
                } else if (question.type === 'fill-blank' || question.type === 'short-answer') {
                    isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.correctAnswer);
                } else {
                    isCorrect = userAnswer === question.correctAnswer;
                }

                if (isCorrect) {
                    correctCount++;
                    points = 10;

                    // Bonus points for difficulty
                    if (question.difficulty === 'intermediate') points += 2;
                    if (question.difficulty === 'advanced') points += 5;
                }

                totalPoints += points;

                return {
                    questionId: question.id || index + 1,
                    question: question.question,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    points,
                    explanation: question.explanation,
                    difficulty: question.difficulty,
                    category: question.category
                };
            });

            const accuracy = Math.round((correctCount / questions.length) * 100);
            const scorePercentage = Math.round((totalPoints / maxPoints) * 100);

            // Record progress
            const progress = new Progress({
                user: userId,
                category: 'quiz',
                activityType: 'quiz',
                activityId: quizId || 'dynamic',
                score: scorePercentage,
                maxScore: 100,
                timeSpent: timeSpent || 0,
                accuracy,
                correctAnswers: correctCount,
                totalQuestions: questions.length,
                difficulty: quizData?.difficulty || quiz?.difficulty || 'mixed',
                language: quizData?.targetLanguage || quiz?.language || 'spanish',
                experienceGained: calculateExperienceGained(correctCount, questions.length, totalPoints)
            });

            await progress.save();

            // Update user progress
            await updateUserQuizProgress(userId, progress.language, {
                experienceGained: progress.experienceGained,
                timeSpent: timeSpent || 0,
                score: scorePercentage,
                accuracy,
                difficulty: progress.difficulty
            });

            // Determine performance level
            let performanceLevel = 'needs-improvement';
            if (accuracy >= 90) performanceLevel = 'excellent';
            else if (accuracy >= 75) performanceLevel = 'good';
            else if (accuracy >= 60) performanceLevel = 'fair';

            res.json({
                quizId: quizId || 'dynamic',
                score: scorePercentage,
                accuracy,
                totalQuestions: questions.length,
                correctAnswers: correctCount,
                totalPoints,
                maxPoints,
                timeSpent: timeSpent || 0,
                performanceLevel,
                experienceGained: progress.experienceGained,
                results,
                recommendations: generateRecommendations(results, performanceLevel)
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error submitting quiz',
                error: error.message
            });
        }
    },

    // Get user's quiz progress and statistics
    getUserProgress: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { language = 'spanish' } = req.query;

            const userProgress = await UserProgress.findOne({
                user: userId,
                language: language.toLowerCase()
            });

            if (!userProgress) {
                return res.json({
                    level: 1,
                    experience: 0,
                    quizzesCompleted: 0,
                    averageScore: 0,
                    bestScore: 0,
                    totalTimeSpent: 0,
                    recentResults: []
                });
            }

            res.json(userProgress.quizProgress);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching user progress',
                error: error.message
            });
        }
    },

    // Get quiz statistics and analytics
    getQuizStats: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { days = 30, language } = req.query;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));

            const filter = {
                user: userId,
                category: 'quiz',
                completedAt: { $gte: startDate }
            };

            if (language) {
                filter.language = language.toLowerCase();
            }

            const stats = await Progress.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                            difficulty: "$difficulty"
                        },
                        count: { $sum: 1 },
                        avgScore: { $avg: "$score" },
                        avgAccuracy: { $avg: "$accuracy" },
                        totalTime: { $sum: "$timeSpent" },
                        totalExperience: { $sum: "$experienceGained" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.date",
                        quizzes: {
                            $push: {
                                difficulty: "$_id.difficulty",
                                count: "$count",
                                avgScore: "$avgScore",
                                avgAccuracy: "$avgAccuracy"
                            }
                        },
                        totalQuizzes: { $sum: "$count" },
                        overallAvgScore: { $avg: "$avgScore" },
                        overallAvgAccuracy: { $avg: "$avgAccuracy" },
                        totalTime: { $sum: "$totalTime" },
                        totalExperience: { $sum: "$totalExperience" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get category breakdown
            const categoryStats = await Progress.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$metadata.category",
                        count: { $sum: 1 },
                        avgScore: { $avg: "$score" },
                        avgAccuracy: { $avg: "$accuracy" }
                    }
                }
            ]);

            res.json({
                dailyStats: stats,
                categoryBreakdown: categoryStats,
                period: `${days} days`
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching quiz statistics',
                error: error.message
            });
        }
    },

    // Create custom quiz (admin/teacher only)
    createQuiz: async (req, res) => {
        try {
            const quizData = {
                ...req.body,
                createdBy: req.user.userId
            };

            const quiz = new Quiz(quizData);
            await quiz.save();

            res.status(201).json({
                message: 'Quiz created successfully',
                quiz
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error creating quiz',
                error: error.message
            });
        }
    },

    // Get quiz categories
    getCategories: async (req, res) => {
        try {
            const { language } = req.query;

            const filter = { isPublic: true };
            if (language) filter.language = language.toLowerCase();

            const categories = await Quiz.distinct('category', filter);

            res.json(categories);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching categories',
                error: error.message
            });
        }
    },

    // Get leaderboard
    getLeaderboard: async (req, res) => {
        try {
            const {
                language,
                difficulty,
                period = 'week', // week, month, all-time
                limit = 10
            } = req.query;

            let startDate;
            if (period === 'week') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
            } else if (period === 'month') {
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
            }

            const filter = { category: 'quiz' };
            if (language) filter.language = language.toLowerCase();
            if (difficulty) filter.difficulty = difficulty;
            if (startDate) filter.completedAt = { $gte: startDate };

            const leaderboard = await Progress.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$user",
                        totalQuizzes: { $sum: 1 },
                        avgScore: { $avg: "$score" },
                        avgAccuracy: { $avg: "$accuracy" },
                        totalExperience: { $sum: "$experienceGained" },
                        bestScore: { $max: "$score" }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$user" },
                {
                    $project: {
                        username: "$user.username",
                        totalQuizzes: 1,
                        avgScore: { $round: ["$avgScore", 1] },
                        avgAccuracy: { $round: ["$avgAccuracy", 1] },
                        totalExperience: 1,
                        bestScore: 1
                    }
                },
                { $sort: { avgScore: -1, totalExperience: -1 } },
                { $limit: parseInt(limit) }
            ]);

            res.json({
                leaderboard,
                period,
                criteria: { language, difficulty }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching leaderboard',
                error: error.message
            });
        }
    }
};

// Helper function to generate vocabulary questions
async function generateVocabularyQuestions(language, targetLanguage, difficulty, category, count) {
    const filter = {
        language: language.toLowerCase(),
        targetLanguage: targetLanguage.toLowerCase(),
        isPublic: true
    };

    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    const words = await Vocabulary.aggregate([
        { $match: filter },
        { $sample: { size: count } }
    ]);

    const questions = await Promise.all(words.map(async (word) => {
        // Get wrong options for multiple choice
        const wrongOptions = await Vocabulary.aggregate([
            {
                $match: {
                    ...filter,
                    _id: { $ne: word._id },
                    category: word.category
                }
            },
            { $sample: { size: 3 } },
            { $project: { translation: 1 } }
        ]);

        const options = [
            { text: word.translation, isCorrect: true },
            ...wrongOptions.map(opt => ({ text: opt.translation, isCorrect: false }))
        ];

        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return {
            type: 'multiple-choice',
            category: 'vocabulary',
            difficulty: word.difficulty,
            question: `What is the ${targetLanguage} translation of "${word.word}"?`,
            options,
            correctAnswer: word.translation,
            explanation: word.examples.length > 0 ? word.examples[0].sentence : null,
            points: 10
        };
    }));

    return questions;
}

// Helper function to generate grammar questions
async function generateGrammarQuestions(language, difficulty, category, count) {
    const filter = {
        language: language.toLowerCase(),
        isPublic: true
    };

    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    const exercises = await GrammarExercise.aggregate([
        { $match: filter },
        { $sample: { size: count } }
    ]);

    return exercises.map(exercise => ({
        type: exercise.type,
        category: 'grammar',
        difficulty: exercise.difficulty,
        question: exercise.question,
        options: exercise.options || [],
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
        points: exercise.points || 10
    }));
}

// Helper function to generate punctuation questions
async function generatePunctuationQuestions(language, difficulty, count) {
    const filter = {
        language: language.toLowerCase(),
        isPublic: true
    };

    if (difficulty) filter.difficulty = difficulty;

    const exercises = await PunctuationExercise.aggregate([
        { $match: filter },
        { $sample: { size: count } }
    ]);

    return exercises.map(exercise => ({
        type: exercise.type,
        category: 'punctuation',
        difficulty: exercise.difficulty,
        question: exercise.question || `Correct the punctuation: "${exercise.text}"`,
        options: exercise.options || [],
        correctAnswer: exercise.correctAnswer || exercise.correctText,
        explanation: exercise.explanation,
        points: exercise.points || 10
    }));
}

// Helper function to regenerate questions with answers for dynamic quizzes
async function regenerateQuestionsWithAnswers(quizData) {
    if (!quizData) return [];

    const { language, targetLanguage, difficulty, category, type } = quizData;
    let questions = [];

    if (type === 'vocabulary' || type === 'mixed') {
        const vocabQuestions = await generateVocabularyQuestions(
            language, targetLanguage, difficulty, category, 5
        );
        questions.push(...vocabQuestions);
    }

    if (type === 'grammar' || type === 'mixed') {
        const grammarQuestions = await generateGrammarQuestions(
            language, difficulty, category, 5
        );
        questions.push(...grammarQuestions);
    }

    if (type === 'punctuation' || type === 'mixed') {
        const punctuationQuestions = await generatePunctuationQuestions(
            language, difficulty, 5
        );
        questions.push(...punctuationQuestions);
    }

    return questions;
}

// Helper function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper function to normalize answers for comparison
function normalizeAnswer(answer) {
    if (!answer) return '';
    return answer.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

// Helper function to calculate experience gained
function calculateExperienceGained(correctCount, totalQuestions, totalPoints) {
    const baseExperience = correctCount * 5;
    const bonusExperience = Math.floor(totalPoints / 10);
    const completionBonus = correctCount === totalQuestions ? 20 : 0;

    return baseExperience + bonusExperience + completionBonus;
}

// Helper function to generate recommendations
function generateRecommendations(results, performanceLevel) {
    const recommendations = [];

    // Analyze weak areas
    const categoryPerformance = {};
    results.forEach(result => {
        if (!categoryPerformance[result.category]) {
            categoryPerformance[result.category] = { correct: 0, total: 0 };
        }
        categoryPerformance[result.category].total++;
        if (result.isCorrect) {
            categoryPerformance[result.category].correct++;
        }
    });

    // Generate specific recommendations
    Object.entries(categoryPerformance).forEach(([category, performance]) => {
        const accuracy = (performance.correct / performance.total) * 100;

        if (accuracy < 60) {
            recommendations.push({
                type: 'practice',
                category,
                message: `Focus on ${category} practice - accuracy is ${Math.round(accuracy)}%`,
                priority: 'high'
            });
        } else if (accuracy < 80) {
            recommendations.push({
                type: 'review',
                category,
                message: `Review ${category} concepts to improve accuracy`,
                priority: 'medium'
            });
        }
    });

    // General recommendations based on performance level
    if (performanceLevel === 'excellent') {
        recommendations.push({
            type: 'challenge',
            message: 'Try a higher difficulty level to continue challenging yourself',
            priority: 'low'
        });
    } else if (performanceLevel === 'needs-improvement') {
        recommendations.push({
            type: 'study',
            message: 'Consider reviewing the basics before taking more quizzes',
            priority: 'high'
        });
    }

    return recommendations;
}

// Helper function to update user quiz progress
async function updateUserQuizProgress(userId, language, data) {
    const { experienceGained, timeSpent, score, accuracy, difficulty } = data;

    const userProgress = await UserProgress.findOneAndUpdate(
        { user: userId, language: language.toLowerCase() },
        {},
        { upsert: true, new: true }
    );

    // Update quiz progress
    userProgress.quizProgress.experience += experienceGained;
    userProgress.quizProgress.totalTimeSpent += timeSpent;
    userProgress.quizProgress.quizzesCompleted += 1;
    userProgress.quizProgress.lastActivity = new Date();

    // Update average score
    const totalQuizzes = userProgress.quizProgress.quizzesCompleted;
    const currentAvgScore = userProgress.quizProgress.averageScore || 0;
    userProgress.quizProgress.averageScore =
        ((currentAvgScore * (totalQuizzes - 1)) + score) / totalQuizzes;

    // Update best score
    userProgress.quizProgress.bestScore = Math.max(
        userProgress.quizProgress.bestScore || 0,
        score
    );

    // Add to recent results
    userProgress.quizProgress.recentResults.unshift({
        score,
        maxScore: 100,
        timeSpent,
        completedAt: new Date(),
        difficulty
    });

    // Keep only last 10 results
    userProgress.quizProgress.recentResults =
        userProgress.quizProgress.recentResults.slice(0, 10);

    // Calculate level based on experience
    const newLevel = Math.floor(userProgress.quizProgress.experience / 1000) + 1;
    userProgress.quizProgress.level = newLevel;

    // Update overall progress
    userProgress.totalExperience += experienceGained;
    userProgress.overallLevel = Math.floor(userProgress.totalExperience / 5000) + 1;

    await userProgress.save();
}

module.exports = quizController;