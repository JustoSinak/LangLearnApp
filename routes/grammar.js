const express = require('express');
const router = express.Router();
const grammarController = require('../controllers/grammarController');
const { auth, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/rules', grammarController.getRules);
router.get('/rules/:id', grammarController.getRule);
router.get('/categories', grammarController.getCategories);

// Protected routes (require authentication)
router.get('/exercises/:ruleId', auth, grammarController.getExercises);
router.get('/practice', auth, grammarController.getPracticeExercises);
router.post('/submit', auth, grammarController.submitExercise);
router.get('/progress', auth, grammarController.getUserProgress);

// Admin routes (require authentication and admin role)
router.post('/rules', auth, requireAdmin, grammarController.createRule);

module.exports = router;
