// routes/quiz.js
const express = require('express');
const router = express.Router();
const { Quiz, Question, QuizAttempt } = require('../models/Quiz');
const auth = require('../middleware/auth');

// Get all quizzes (with filters)
router.get('/', async (req, res) => {
    try {
        const { language, difficulty, category } = req.query;
        const filter = { isPublic: true };
        
        if (language) filter.language = language;
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;

        const quizzes = await Quiz.find(filter)
            .populate('createdBy', 'username')
            .select('-questions');

        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get specific quiz with questions
router.get('/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('questions')
            .populate('createdBy', 'username');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new quiz
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, language, difficulty, category, questions } = req.body;

        // Create quiz
        const quiz = new Quiz({
            title,
            description,
            language,
            difficulty,
            category,
            createdBy: req.user.id
        });

        await quiz.save();

        // Create questions
        const questionPromises = questions.map(q => {
            const question = new Question({
                ...q,
                quizId: quiz._id
            });
            return question.save();
        });

        const savedQuestions = await Promise.all(questionPromises);
        quiz.questions = savedQuestions.map(q => q._id);
        await quiz.save();

        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit quiz attempt
router.post('/:id/submit', auth, async (req, res) => {
    try {
        const { answers } = req.body;
        const quiz = await Quiz.findById(req.params.id).populate('questions');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score
        let score = 0;
        const gradedAnswers = answers.map(answer => {
            const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
            const isCorrect = question.options.find(opt => opt.isCorrect)._id.toString() === answer.selectedOption;
            if (isCorrect) score += question.points;
            return { ...answer, isCorrect };
        });

        // Save attempt
        const attempt = new QuizAttempt({
            userId: req.user.id,
            quizId: quiz._id,
            answers: gradedAnswers,
            score
        });

        await attempt.save();

        res.json({
            score,
            totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
            answers: gradedAnswers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;