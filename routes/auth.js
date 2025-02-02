const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const vocabularyController = require('../controllers/vocabularyController');
const flashcardController = require('../controllers/flashcardController');
const quizController = require('../controllers/quizController');



router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/quiz', quizController.generateQuiz)
// Protected routes
router.use(auth);

// Vocabulary routes
router.post('/vocabulary', vocabularyController.addWord);
router.get('/vocabulary/quiz', vocabularyController.getQuiz);

// Flashcard routes
router.post('/flashcards', flashcardController.create);
router.get('/flashcards/due', flashcardController.getDueCards);
router.post('/flashcards/review', flashcardController.updateReview);

// Quiz routes
router.get('/quiz/generate', quizController.generateQuiz);
router.post('/quiz/submit', quizController.submitQuiz);

// router.post('/', userController.createUser);
// router.get('/', userController.getUsers);
// router.get('/:id', userController.getUserById);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);


module.exports = router;