const Vocabulary = require('../models/Vocabulary');
const { Progress } = require('../models/Progress');
const UserProgress = require('../models/UserProgress');

const vocabularyController = {
    // Get all vocabulary words with filtering and pagination
    getWords: async (req, res) => {
        try {
            const {
                language,
                targetLanguage,
                difficulty,
                category,
                partOfSpeech,
                page = 1,
                limit = 20,
                search
            } = req.query;

            const filter = { isPublic: true };

            if (language) filter.language = language.toLowerCase();
            if (targetLanguage) filter.targetLanguage = targetLanguage.toLowerCase();
            if (difficulty) filter.difficulty = difficulty;
            if (category) filter.category = category;
            if (partOfSpeech) filter.partOfSpeech = partOfSpeech;

            // Search functionality
            if (search) {
                filter.$or = [
                    { word: { $regex: search, $options: 'i' } },
                    { translation: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;

            const words = await Vocabulary.find(filter)
                .populate('createdBy', 'username')
                .sort({ frequency: -1, word: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Vocabulary.countDocuments(filter);

            res.json({
                words,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching vocabulary words',
                error: error.message
            });
        }
    },

    // Get specific word by ID
    getWord: async (req, res) => {
        try {
            const word = await Vocabulary.findById(req.params.id)
                .populate('createdBy', 'username');

            if (!word) {
                return res.status(404).json({ message: 'Word not found' });
            }

            res.json(word);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching word',
                error: error.message
            });
        }
    },

    // Add new vocabulary word
    addWord: async (req, res) => {
        try {
            const wordData = {
                ...req.body,
                createdBy: req.user.userId
            };

            // Check if word already exists
            const existingWord = await Vocabulary.findOne({
                word: wordData.word.toLowerCase(),
                language: wordData.language.toLowerCase(),
                targetLanguage: wordData.targetLanguage.toLowerCase()
            });

            if (existingWord) {
                return res.status(400).json({
                    message: 'Word already exists in the database'
                });
            }

            const newWord = new Vocabulary(wordData);
            await newWord.save();

            res.status(201).json({
                message: 'Word added successfully',
                word: newWord
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error adding word',
                error: error.message
            });
        }
    },

    // Get vocabulary quiz/practice words
    getPracticeWords: async (req, res) => {
        try {
            const {
                language = 'english',
                targetLanguage = 'spanish',
                difficulty,
                category,
                count = 10,
                type = 'mixed' // translation, definition, audio
            } = req.query;

            const filter = {
                isPublic: true,
                language: language.toLowerCase(),
                targetLanguage: targetLanguage.toLowerCase()
            };

            if (difficulty) filter.difficulty = difficulty;
            if (category) filter.category = category;

            // Get user's progress to avoid recently practiced words
            const userId = req.user.userId;
            const userProgress = await UserProgress.findOne({
                user: userId,
                language: targetLanguage.toLowerCase()
            });

            let excludeWords = [];
            if (userProgress && userProgress.vocabularyProgress.masteredWords.length > 0) {
                // Get recently mastered words (last 24 hours) to reduce repetition
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                excludeWords = userProgress.vocabularyProgress.masteredWords
                    .filter(w => w.masteredAt > oneDayAgo)
                    .map(w => w.wordId);
            }

            if (excludeWords.length > 0) {
                filter._id = { $nin: excludeWords };
            }

            const words = await Vocabulary.aggregate([
                { $match: filter },
                { $sample: { size: parseInt(count) } }
            ]);

            // Format words for practice based on type
            const practiceWords = words.map(word => {
                const baseWord = {
                    _id: word._id,
                    word: word.word,
                    translation: word.translation,
                    partOfSpeech: word.partOfSpeech,
                    difficulty: word.difficulty,
                    category: word.category,
                    examples: word.examples,
                    pronunciation: word.pronunciation
                };

                // Generate practice question based on type
                if (type === 'translation' || type === 'mixed') {
                    return {
                        ...baseWord,
                        question: `What is the ${targetLanguage} translation of "${word.word}"?`,
                        correctAnswer: word.translation,
                        type: 'translation'
                    };
                } else if (type === 'definition') {
                    return {
                        ...baseWord,
                        question: `What does "${word.word}" mean?`,
                        correctAnswer: word.translation,
                        type: 'definition'
                    };
                }

                return baseWord;
            });

            res.json(practiceWords);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching practice words',
                error: error.message
            });
        }
    },

    // Generate vocabulary quiz with multiple choice options
    generateQuiz: async (req, res) => {
        try {
            const {
                language = 'english',
                targetLanguage = 'spanish',
                difficulty,
                category,
                count = 10
            } = req.query;

            const filter = {
                isPublic: true,
                language: language.toLowerCase(),
                targetLanguage: targetLanguage.toLowerCase()
            };

            if (difficulty) filter.difficulty = difficulty;
            if (category) filter.category = category;

            const words = await Vocabulary.aggregate([
                { $match: filter },
                { $sample: { size: parseInt(count) } }
            ]);

            if (words.length === 0) {
                return res.status(404).json({
                    message: 'No vocabulary words found for the specified criteria'
                });
            }

            // Generate quiz questions with multiple choice options
            const quizQuestions = await Promise.all(words.map(async (word, index) => {
                // Get wrong options from the same category/difficulty
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
                    id: word._id,
                    question: `What is the ${targetLanguage} translation of "${word.word}"?`,
                    word: word.word,
                    options,
                    correctAnswer: word.translation,
                    difficulty: word.difficulty,
                    category: word.category,
                    partOfSpeech: word.partOfSpeech,
                    examples: word.examples,
                    pronunciation: word.pronunciation
                };
            }));

            res.json({
                quiz: {
                    id: `vocab_quiz_${Date.now()}`,
                    title: `${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)} Vocabulary Quiz`,
                    description: `Test your ${targetLanguage} vocabulary knowledge`,
                    language,
                    targetLanguage,
                    difficulty: difficulty || 'mixed',
                    category: category || 'mixed',
                    totalQuestions: quizQuestions.length,
                    questions: quizQuestions
                }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error generating quiz',
                error: error.message
            });
        }
    },

    // Submit vocabulary practice/quiz answer
    submitAnswer: async (req, res) => {
        try {
            const { wordId, answer, timeSpent, type = 'practice' } = req.body;
            const userId = req.user.userId;

            const word = await Vocabulary.findById(wordId);
            if (!word) {
                return res.status(404).json({ message: 'Word not found' });
            }

            // Check if answer is correct
            const isCorrect = answer.toLowerCase().trim() === word.translation.toLowerCase().trim();
            const score = isCorrect ? 100 : 0;

            // Record progress
            const progress = new Progress({
                user: userId,
                category: 'vocabulary',
                activityType: type,
                activityId: wordId,
                score,
                maxScore: 100,
                timeSpent: timeSpent || 0,
                accuracy: isCorrect ? 100 : 0,
                correctAnswers: isCorrect ? 1 : 0,
                totalQuestions: 1,
                difficulty: word.difficulty,
                language: word.targetLanguage,
                experienceGained: isCorrect ? 10 : 2
            });

            await progress.save();

            // Update user vocabulary progress
            await updateUserVocabularyProgress(userId, word.targetLanguage, {
                experienceGained: progress.experienceGained,
                timeSpent: timeSpent || 0,
                isCorrect,
                wordId: word._id
            });

            res.json({
                correct: isCorrect,
                score,
                correctAnswer: word.translation,
                explanation: word.examples.length > 0 ? word.examples[0].sentence : null,
                experienceGained: progress.experienceGained,
                pronunciation: word.pronunciation
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error submitting answer',
                error: error.message
            });
        }
    },

    // Get user's vocabulary progress
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
                    wordsLearned: 0,
                    wordsMastered: 0,
                    averageAccuracy: 0,
                    totalTimeSpent: 0,
                    masteredWords: []
                });
            }

            res.json(userProgress.vocabularyProgress);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching user progress',
                error: error.message
            });
        }
    },

    // Get vocabulary categories
    getCategories: async (req, res) => {
        try {
            const { language = 'english', targetLanguage = 'spanish' } = req.query;

            const categories = await Vocabulary.distinct('category', {
                language: language.toLowerCase(),
                targetLanguage: targetLanguage.toLowerCase(),
                isPublic: true
            });

            res.json(categories);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching categories',
                error: error.message
            });
        }
    },

    // Get word banks (organized vocabulary lists)
    getWordBanks: async (req, res) => {
        try {
            const {
                language = 'english',
                targetLanguage = 'spanish',
                difficulty,
                category
            } = req.query;

            const filter = {
                language: language.toLowerCase(),
                targetLanguage: targetLanguage.toLowerCase(),
                isPublic: true
            };

            if (difficulty) filter.difficulty = difficulty;
            if (category) filter.category = category;

            // Group words by category and difficulty
            const wordBanks = await Vocabulary.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            category: '$category',
                            difficulty: '$difficulty'
                        },
                        words: {
                            $push: {
                                _id: '$_id',
                                word: '$word',
                                translation: '$translation',
                                partOfSpeech: '$partOfSpeech',
                                examples: '$examples',
                                pronunciation: '$pronunciation'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: '$_id.category',
                        difficulties: {
                            $push: {
                                difficulty: '$_id.difficulty',
                                words: '$words',
                                count: '$count'
                            }
                        },
                        totalWords: { $sum: '$count' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            res.json(wordBanks);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching word banks',
                error: error.message
            });
        }
    },

    // Spaced repetition - get words due for review
    getWordsForReview: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { language = 'spanish', limit = 20 } = req.query;

            // Get user's vocabulary progress
            const userProgress = await UserProgress.findOne({
                user: userId,
                language: language.toLowerCase()
            });

            if (!userProgress || userProgress.vocabularyProgress.masteredWords.length === 0) {
                return res.json([]);
            }

            // Calculate which words need review based on spaced repetition
            const now = new Date();
            const wordsForReview = [];

            for (const masteredWord of userProgress.vocabularyProgress.masteredWords) {
                const daysSinceMastered = Math.floor((now - masteredWord.masteredAt) / (1000 * 60 * 60 * 24));
                const reviewInterval = calculateReviewInterval(masteredWord.reviewCount, masteredWord.accuracy);

                if (daysSinceMastered >= reviewInterval) {
                    wordsForReview.push(masteredWord.wordId);
                }
            }

            if (wordsForReview.length === 0) {
                return res.json([]);
            }

            // Get the actual word data
            const words = await Vocabulary.find({
                _id: { $in: wordsForReview.slice(0, limit) }
            });

            res.json(words);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching words for review',
                error: error.message
            });
        }
    }
};

// Helper function to update user vocabulary progress
async function updateUserVocabularyProgress(userId, language, data) {
    const { experienceGained, timeSpent, isCorrect, wordId } = data;

    const userProgress = await UserProgress.findOneAndUpdate(
        { user: userId, language: language.toLowerCase() },
        {},
        { upsert: true, new: true }
    );

    // Update vocabulary progress
    userProgress.vocabularyProgress.experience += experienceGained;
    userProgress.vocabularyProgress.totalTimeSpent += timeSpent;
    userProgress.vocabularyProgress.lastActivity = new Date();

    // Calculate level based on experience
    const newLevel = Math.floor(userProgress.vocabularyProgress.experience / 1000) + 1;
    userProgress.vocabularyProgress.level = newLevel;

    // Update overall progress
    userProgress.totalExperience += experienceGained;
    userProgress.overallLevel = Math.floor(userProgress.totalExperience / 5000) + 1;

    if (isCorrect && wordId) {
        // Check if word is already mastered
        const existingWord = userProgress.vocabularyProgress.masteredWords.find(
            w => w.wordId.toString() === wordId.toString()
        );

        if (existingWord) {
            // Update existing mastered word
            existingWord.reviewCount += 1;
            existingWord.accuracy = Math.min(100, existingWord.accuracy + 5);
        } else {
            // Add new mastered word
            userProgress.vocabularyProgress.masteredWords.push({
                wordId,
                masteredAt: new Date(),
                reviewCount: 1,
                accuracy: 100
            });
            userProgress.vocabularyProgress.wordsMastered += 1;
        }

        userProgress.vocabularyProgress.wordsLearned = Math.max(
            userProgress.vocabularyProgress.wordsLearned,
            userProgress.vocabularyProgress.wordsMastered
        );
    }

    await userProgress.save();
}

// Helper function to calculate spaced repetition interval
function calculateReviewInterval(reviewCount, accuracy) {
    // Base intervals in days: 1, 3, 7, 14, 30, 60, 120
    const baseIntervals = [1, 3, 7, 14, 30, 60, 120];
    const maxInterval = 120;

    let interval = baseIntervals[Math.min(reviewCount, baseIntervals.length - 1)] || maxInterval;

    // Adjust based on accuracy
    if (accuracy < 70) {
        interval = Math.max(1, Math.floor(interval * 0.5));
    } else if (accuracy > 90) {
        interval = Math.min(maxInterval, Math.floor(interval * 1.3));
    }

    return interval;
}

module.exports = vocabularyController;