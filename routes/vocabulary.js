const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabularyController');
const { auth, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/words', vocabularyController.getWords);
router.get('/words/:id', vocabularyController.getWord);
router.get('/categories', vocabularyController.getCategories);
router.get('/word-banks', vocabularyController.getWordBanks);

// Protected routes (require authentication)
router.get('/practice', auth, vocabularyController.getPracticeWords);
router.get('/quiz', auth, vocabularyController.generateQuiz);
router.get('/review', auth, vocabularyController.getWordsForReview);
router.post('/submit', auth, vocabularyController.submitAnswer);
router.get('/progress', auth, vocabularyController.getUserProgress);

// Admin routes (require authentication and admin role)
router.post('/words', auth, requireAdmin, vocabularyController.addWord);

module.exports = router;