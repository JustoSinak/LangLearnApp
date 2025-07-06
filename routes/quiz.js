const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { auth, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/categories', quizController.getCategories);
router.get('/leaderboard', quizController.getLeaderboard);

// Protected routes (require authentication)
router.get('/', auth, quizController.getQuizzes);
router.get('/generate', auth, quizController.generateQuiz);
router.get('/stats', auth, quizController.getQuizStats);
router.get('/progress', auth, quizController.getUserProgress);
router.get('/:quizId', auth, quizController.getQuiz);
router.post('/submit', auth, quizController.submitQuiz);

// Admin routes (require authentication and admin role)
router.post('/', auth, requireAdmin, quizController.createQuiz);

module.exports = router;