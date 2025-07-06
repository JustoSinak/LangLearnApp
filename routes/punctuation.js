const express = require('express');
const router = express.Router();
const punctuationController = require('../controllers/punctuationController');
const { auth, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/rules', punctuationController.getRules);
router.get('/rules/:id', punctuationController.getRule);
router.get('/marks', punctuationController.getPunctuationMarks);

// Protected routes (require authentication)
router.get('/exercises/:ruleId', auth, punctuationController.getExercises);
router.get('/practice', auth, punctuationController.getPracticeExercises);
router.get('/text-correction', auth, punctuationController.getTextCorrectionExercise);
router.post('/submit', auth, punctuationController.submitExercise);
router.get('/progress', auth, punctuationController.getUserProgress);

// Admin routes (require authentication and admin role)
router.post('/rules', auth, requireAdmin, punctuationController.createRule);

module.exports = router;
