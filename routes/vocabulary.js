const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabularyController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, vocabularyController.getQuiz);
router.post('/', authMiddleware, vocabularyController.addWord);

module.exports = router;