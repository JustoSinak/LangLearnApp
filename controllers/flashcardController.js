const { FlashcardDeck, Flashcard, FlashcardReview } = require('../models/Flashcard');
const { Progress } = require('../models/Progress');
const UserProgress = require('../models/UserProgress');
const Vocabulary = require('../models/Vocabulary');

const flashcardController = {
    // Get all decks for a user
    getDecks: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { language, page = 1, limit = 20 } = req.query;

            const filter = { user: userId };
            if (language) filter.language = language.toLowerCase();

            const skip = (page - 1) * limit;

            const decks = await FlashcardDeck.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Get card counts for each deck
            const decksWithCounts = await Promise.all(decks.map(async (deck) => {
                const cardCounts = await Flashcard.aggregate([
                    { $match: { deck: deck._id, isActive: true } },
                    {
                        $group: {
                            _id: '$reviewStatus',
                            count: { $sum: 1 }
                        }
                    }
                ]);

                const counts = {
                    total: 0,
                    new: 0,
                    learning: 0,
                    review: 0,
                    mastered: 0
                };

                cardCounts.forEach(item => {
                    counts[item._id] = item.count;
                    counts.total += item.count;
                });

                return {
                    ...deck.toObject(),
                    cardCounts: counts
                };
            }));

            const total = await FlashcardDeck.countDocuments(filter);

            res.json({
                decks: decksWithCounts,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching decks',
                error: error.message
            });
        }
    },

    // Create new deck
    createDeck: async (req, res) => {
        try {
            const deckData = {
                ...req.body,
                user: req.user.userId
            };

            const deck = new FlashcardDeck(deckData);
            await deck.save();

            res.status(201).json({
                message: 'Deck created successfully',
                deck
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error creating deck',
                error: error.message
            });
        }
    },

    // Get specific deck with cards
    getDeck: async (req, res) => {
        try {
            const { deckId } = req.params;
            const userId = req.user.userId;

            const deck = await FlashcardDeck.findOne({
                _id: deckId,
                user: userId
            });

            if (!deck) {
                return res.status(404).json({ message: 'Deck not found' });
            }

            const cards = await Flashcard.find({
                deck: deckId,
                isActive: true
            }).populate('vocabulary');

            res.json({
                deck,
                cards
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching deck',
                error: error.message
            });
        }
    },

    // Create new flashcard
    createCard: async (req, res) => {
        try {
            const cardData = {
                ...req.body,
                user: req.user.userId
            };

            // Validate deck ownership
            const deck = await FlashcardDeck.findOne({
                _id: cardData.deck,
                user: req.user.userId
            });

            if (!deck) {
                return res.status(404).json({ message: 'Deck not found' });
            }

            const card = new Flashcard(cardData);
            await card.save();

            // Update deck card count
            await FlashcardDeck.findByIdAndUpdate(
                cardData.deck,
                { $inc: { cardCount: 1 } }
            );

            res.status(201).json({
                message: 'Flashcard created successfully',
                card
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error creating flashcard',
                error: error.message
            });
        }
    },

    // Get cards due for review
    getDueCards: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { deckId, limit = 20 } = req.query;

            const filter = {
                user: userId,
                nextReviewDate: { $lte: new Date() },
                isActive: true
            };

            if (deckId) {
                filter.deck = deckId;
            }

            const dueCards = await Flashcard.find(filter)
                .populate('deck', 'name language')
                .populate('vocabulary')
                .sort('nextReviewDate')
                .limit(parseInt(limit));

            res.json(dueCards);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching due cards',
                error: error.message
            });
        }
    },

    // Submit flashcard review
    submitReview: async (req, res) => {
        try {
            const { cardId, performance, timeSpent } = req.body;
            const userId = req.user.userId;

            // Validate performance value
            if (!['again', 'hard', 'good', 'easy'].includes(performance)) {
                return res.status(400).json({
                    message: 'Invalid performance value'
                });
            }

            const card = await Flashcard.findOne({
                _id: cardId,
                user: userId
            }).populate('deck');

            if (!card) {
                return res.status(404).json({ message: 'Flashcard not found' });
            }

            // Store previous values for review record
            const previousEaseFactor = card.easeFactor;
            const previousInterval = card.interval;

            // Apply spaced repetition algorithm (SM-2 based)
            const result = calculateSpacedRepetition(card, performance);

            // Update card
            card.easeFactor = result.easeFactor;
            card.interval = result.interval;
            card.repetition = result.repetition;
            card.reviewStatus = result.reviewStatus;
            card.nextReviewDate = result.nextReviewDate;
            card.lastReviewDate = new Date();
            card.reviewCount += 1;

            if (performance === 'again') {
                card.incorrectCount += 1;
            } else {
                card.correctCount += 1;
            }

            // Add to review history
            card.reviewHistory.push({
                performance,
                timeSpent: timeSpent || 0,
                previousInterval,
                newInterval: result.interval
            });

            await card.save();

            // Create review record
            const review = new FlashcardReview({
                user: userId,
                flashcard: cardId,
                deck: card.deck._id,
                performance,
                timeSpent: timeSpent || 0,
                previousEaseFactor,
                newEaseFactor: result.easeFactor,
                previousInterval,
                newInterval: result.interval
            });

            await review.save();

            // Record progress
            const progress = new Progress({
                user: userId,
                category: 'flashcard',
                activityType: 'flashcard-review',
                activityId: cardId,
                score: getPerformanceScore(performance),
                maxScore: 100,
                timeSpent: timeSpent || 0,
                accuracy: performance !== 'again' ? 100 : 0,
                correctAnswers: performance !== 'again' ? 1 : 0,
                totalQuestions: 1,
                difficulty: card.difficulty,
                language: card.deck.language,
                experienceGained: getExperienceGained(performance)
            });

            await progress.save();

            // Update user progress
            await updateUserFlashcardProgress(userId, card.deck.language, {
                experienceGained: progress.experienceGained,
                timeSpent: timeSpent || 0,
                performance,
                deckId: card.deck._id
            });

            res.json({
                message: 'Review submitted successfully',
                card: {
                    _id: card._id,
                    reviewStatus: card.reviewStatus,
                    nextReviewDate: card.nextReviewDate,
                    interval: card.interval
                },
                experienceGained: progress.experienceGained,
                nextReviewIn: Math.ceil((result.nextReviewDate - new Date()) / (1000 * 60 * 60 * 24))
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error submitting review',
                error: error.message
            });
        }
    },

    // Get user's flashcard progress
    getUserProgress: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { language } = req.query;

            const userProgress = await UserProgress.findOne({
                user: userId,
                language: language?.toLowerCase()
            });

            if (!userProgress) {
                return res.json({
                    level: 1,
                    experience: 0,
                    cardsReviewed: 0,
                    cardsMastered: 0,
                    averageAccuracy: 0,
                    totalTimeSpent: 0,
                    deckProgress: []
                });
            }

            res.json(userProgress.flashcardProgress);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching user progress',
                error: error.message
            });
        }
    },

    // Get review statistics
    getReviewStats: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { deckId, days = 30 } = req.query;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));

            const filter = {
                user: userId,
                reviewDate: { $gte: startDate }
            };

            if (deckId) {
                filter.deck = deckId;
            }

            const stats = await FlashcardReview.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$reviewDate" } },
                            performance: "$performance"
                        },
                        count: { $sum: 1 },
                        totalTime: { $sum: "$timeSpent" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.date",
                        reviews: {
                            $push: {
                                performance: "$_id.performance",
                                count: "$count"
                            }
                        },
                        totalReviews: { $sum: "$count" },
                        totalTime: { $sum: "$totalTime" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            res.json(stats);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching review stats',
                error: error.message
            });
        }
    },

    // Create flashcards from vocabulary
    createFromVocabulary: async (req, res) => {
        try {
            const { deckId, vocabularyIds } = req.body;
            const userId = req.user.userId;

            // Validate deck ownership
            const deck = await FlashcardDeck.findOne({
                _id: deckId,
                user: userId
            });

            if (!deck) {
                return res.status(404).json({ message: 'Deck not found' });
            }

            // Get vocabulary words
            const vocabularyWords = await Vocabulary.find({
                _id: { $in: vocabularyIds }
            });

            if (vocabularyWords.length === 0) {
                return res.status(404).json({ message: 'No vocabulary words found' });
            }

            // Create flashcards
            const flashcards = vocabularyWords.map(word => ({
                deck: deckId,
                user: userId,
                vocabulary: word._id,
                front: word.word,
                back: word.translation,
                difficulty: word.difficulty,
                hints: word.examples.map(ex => ex.sentence).slice(0, 2)
            }));

            const createdCards = await Flashcard.insertMany(flashcards);

            // Update deck card count
            await FlashcardDeck.findByIdAndUpdate(
                deckId,
                { $inc: { cardCount: createdCards.length } }
            );

            res.status(201).json({
                message: `${createdCards.length} flashcards created successfully`,
                cards: createdCards
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error creating flashcards from vocabulary',
                error: error.message
            });
        }
    },

    // Update deck
    updateDeck: async (req, res) => {
        try {
            const { deckId } = req.params;
            const userId = req.user.userId;
            const updates = req.body;

            const deck = await FlashcardDeck.findOneAndUpdate(
                { _id: deckId, user: userId },
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!deck) {
                return res.status(404).json({ message: 'Deck not found' });
            }

            res.json({
                message: 'Deck updated successfully',
                deck
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error updating deck',
                error: error.message
            });
        }
    },

    // Delete deck
    deleteDeck: async (req, res) => {
        try {
            const { deckId } = req.params;
            const userId = req.user.userId;

            const deck = await FlashcardDeck.findOne({
                _id: deckId,
                user: userId
            });

            if (!deck) {
                return res.status(404).json({ message: 'Deck not found' });
            }

            // Delete all cards in the deck
            await Flashcard.deleteMany({ deck: deckId });

            // Delete the deck
            await FlashcardDeck.findByIdAndDelete(deckId);

            res.json({ message: 'Deck deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: 'Error deleting deck',
                error: error.message
            });
        }
    },

    // Update card
    updateCard: async (req, res) => {
        try {
            const { cardId } = req.params;
            const userId = req.user.userId;
            const updates = req.body;

            const card = await Flashcard.findOneAndUpdate(
                { _id: cardId, user: userId },
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!card) {
                return res.status(404).json({ message: 'Flashcard not found' });
            }

            res.json({
                message: 'Flashcard updated successfully',
                card
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error updating flashcard',
                error: error.message
            });
        }
    },

    // Delete card
    deleteCard: async (req, res) => {
        try {
            const { cardId } = req.params;
            const userId = req.user.userId;

            const card = await Flashcard.findOne({
                _id: cardId,
                user: userId
            });

            if (!card) {
                return res.status(404).json({ message: 'Flashcard not found' });
            }

            // Soft delete by setting isActive to false
            card.isActive = false;
            await card.save();

            // Update deck card count
            await FlashcardDeck.findByIdAndUpdate(
                card.deck,
                { $inc: { cardCount: -1 } }
            );

            res.json({ message: 'Flashcard deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: 'Error deleting flashcard',
                error: error.message
            });
        }
    }
};

// Helper function to calculate spaced repetition (SM-2 algorithm)
function calculateSpacedRepetition(card, performance) {
    let { easeFactor, interval, repetition } = card;

    // Performance mapping: again=0, hard=1, good=2, easy=3
    const performanceMap = {
        'again': 0,
        'hard': 1,
        'good': 2,
        'easy': 3
    };

    const quality = performanceMap[performance];

    if (quality >= 2) {
        // Correct response
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetition += 1;
    } else {
        // Incorrect response
        repetition = 0;
        interval = 1;
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Determine review status
    let reviewStatus;
    if (repetition === 0) {
        reviewStatus = 'new';
    } else if (repetition < 3) {
        reviewStatus = 'learning';
    } else if (interval < 21) {
        reviewStatus = 'review';
    } else {
        reviewStatus = 'mastered';
    }

    return {
        easeFactor,
        interval,
        repetition,
        nextReviewDate,
        reviewStatus
    };
}

// Helper function to get performance score
function getPerformanceScore(performance) {
    const scores = {
        'again': 0,
        'hard': 50,
        'good': 80,
        'easy': 100
    };
    return scores[performance] || 0;
}

// Helper function to get experience gained
function getExperienceGained(performance) {
    const experience = {
        'again': 1,
        'hard': 3,
        'good': 5,
        'easy': 8
    };
    return experience[performance] || 1;
}

// Helper function to update user flashcard progress
async function updateUserFlashcardProgress(userId, language, data) {
    const { experienceGained, timeSpent, performance, deckId } = data;

    const userProgress = await UserProgress.findOneAndUpdate(
        { user: userId, language: language.toLowerCase() },
        {},
        { upsert: true, new: true }
    );

    // Update flashcard progress
    userProgress.flashcardProgress.experience += experienceGained;
    userProgress.flashcardProgress.totalTimeSpent += timeSpent;
    userProgress.flashcardProgress.cardsReviewed += 1;
    userProgress.flashcardProgress.lastActivity = new Date();

    if (performance !== 'again') {
        // Update accuracy
        const totalReviews = userProgress.flashcardProgress.cardsReviewed;
        const currentAccuracy = userProgress.flashcardProgress.averageAccuracy || 0;
        userProgress.flashcardProgress.averageAccuracy =
            ((currentAccuracy * (totalReviews - 1)) + 100) / totalReviews;
    }

    // Calculate level based on experience
    const newLevel = Math.floor(userProgress.flashcardProgress.experience / 1000) + 1;
    userProgress.flashcardProgress.level = newLevel;

    // Update overall progress
    userProgress.totalExperience += experienceGained;
    userProgress.overallLevel = Math.floor(userProgress.totalExperience / 5000) + 1;

    // Update deck progress
    const existingDeckProgress = userProgress.flashcardProgress.deckProgress.find(
        dp => dp.deckId.toString() === deckId.toString()
    );

    if (existingDeckProgress) {
        existingDeckProgress.lastReviewed = new Date();
    } else {
        userProgress.flashcardProgress.deckProgress.push({
            deckId,
            lastReviewed: new Date()
        });
    }

    await userProgress.save();
}

module.exports = flashcardController;