const  Flashcards  = require('../models/Flashcard');

const flashcardController = {
    // Create new flashcard
    create: async (req, res) => {
        try {
            const { front, back, category } = req.body;
            const flashcard = new Flashcard({
                user: req.user.userId,
                front,
                back,
                category,
                lastReviewed: new Date(),
                nextReview: new Date()
            });
            await flashcard.save();
            res.status(201).json(flashcard);
        } catch (error) {
            res.status(500).json({ message: 'Error creating flashcard', error: error.message });
        }
    },

    // Get due flashcards
    getDueCards: async (req, res) => {
        try {
            const dueCards = await Flashcard.find({
                user: req.user.userId,
                nextReview: { $lte: new Date() }
            }).sort('nextReview');
            res.json(dueCards);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching flashcards', error: error.message });
        }
    },

    // Update review status
    updateReview: async (req, res) => {
        try {
            const { flashcardId, quality } = req.body;
            const flashcard = await Flashcard.findById(flashcardId);
            
            if (!flashcard) {
                return res.status(404).json({ message: 'Flashcard not found' });
            }

            // Simple spaced repetition algorithm
            const factor = Math.max(1.3, Math.min(2.5, quality * 0.5));
            flashcard.interval *= factor;
            flashcard.lastReviewed = new Date();
            flashcard.nextReview = new Date(Date.now() + flashcard.interval * 24 * 60 * 60 * 1000);
            
            await flashcard.save();
            res.json(flashcard);
        } catch (error) {
            res.status(500).json({ message: 'Error updating review', error: error.message });
        }
    }
};

module.exports = flashcardController;