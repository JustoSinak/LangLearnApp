const mongoose = require('mongoose');

const flashcardDeckSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Deck name is required'],
        trim: true
    },
    description: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    language: {
        type: String,
        required: true,
        lowercase: true
    },
    category: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [String],
    cardCount: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: '#3B82F6'
    }
}, {
    timestamps: true
});

const flashcardSchema = new mongoose.Schema({
    deck: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlashcardDeck',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vocabulary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vocabulary'
    },
    front: {
        type: String,
        required: [true, 'Front content is required']
    },
    back: {
        type: String,
        required: [true, 'Back content is required']
    },
    frontImage: String,
    backImage: String,
    notes: String,
    hints: [String],
    reviewStatus: {
        type: String,
        enum: ['new', 'learning', 'review', 'mastered'],
        default: 'new'
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    nextReviewDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastReviewDate: Date,
    reviewCount: {
        type: Number,
        default: 0
    },
    correctCount: {
        type: Number,
        default: 0
    },
    incorrectCount: {
        type: Number,
        default: 0
    },
    easeFactor: {
        type: Number,
        default: 2.5,
        min: 1.3
    },
    interval: {
        type: Number,
        default: 1 // days
    },
    repetition: {
        type: Number,
        default: 0
    },
    reviewHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        performance: {
            type: String,
            enum: ['again', 'hard', 'good', 'easy'],
            required: true
        },
        timeSpent: Number, // in seconds
        previousInterval: Number,
        newInterval: Number
    }],
    tags: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    }
}, {
    timestamps: true
});

const flashcardReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    flashcard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flashcard',
        required: true
    },
    deck: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlashcardDeck',
        required: true
    },
    performance: {
        type: String,
        enum: ['again', 'hard', 'good', 'easy'],
        required: true
    },
    timeSpent: {
        type: Number,
        required: true // in seconds
    },
    reviewDate: {
        type: Date,
        default: Date.now
    },
    previousEaseFactor: Number,
    newEaseFactor: Number,
    previousInterval: Number,
    newInterval: Number
}, {
    timestamps: true
});

// Indexes for better performance
flashcardDeckSchema.index({ user: 1, name: 1 });
flashcardSchema.index({ user: 1, deck: 1 });
flashcardSchema.index({ user: 1, nextReviewDate: 1 });
flashcardSchema.index({ deck: 1, reviewStatus: 1 });
flashcardReviewSchema.index({ user: 1, reviewDate: -1 });

const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);
const Flashcard = mongoose.model('Flashcard', flashcardSchema);
const FlashcardReview = mongoose.model('FlashcardReview', flashcardReviewSchema);

module.exports = {
    FlashcardDeck,
    Flashcard,
    FlashcardReview
};