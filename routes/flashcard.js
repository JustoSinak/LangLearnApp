const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');
const { auth } = require('../middleware/auth');

// All flashcard routes require authentication
router.use(auth);

// Deck routes
router.get('/decks', flashcardController.getDecks);
router.post('/decks', flashcardController.createDeck);
router.get('/decks/:deckId', flashcardController.getDeck);
router.put('/decks/:deckId', flashcardController.updateDeck);
router.delete('/decks/:deckId', flashcardController.deleteDeck);

// Card routes
router.post('/cards', flashcardController.createCard);
router.get('/cards/due', flashcardController.getDueCards);
router.post('/cards/from-vocabulary', flashcardController.createFromVocabulary);
router.put('/cards/:cardId', flashcardController.updateCard);
router.delete('/cards/:cardId', flashcardController.deleteCard);

// Review routes
router.post('/review', flashcardController.submitReview);
router.get('/stats', flashcardController.getReviewStats);
router.get('/progress', flashcardController.getUserProgress);

module.exports = router;
