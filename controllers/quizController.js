const  Quiz  = require('../models/Quiz');

const quizController = {
    // Generate quiz
    generateQuiz: async (req, res) => {
        try {
            const { difficulty, type } = req.query;
            const quiz = await Quiz.aggregate([
                { $match: { difficulty, 'questions.type': type } },
                { $sample: { size: 1 } }
            ]);

            if (!quiz.length) {
                return res.status(404).json({ message: 'No quiz available' });
            }

            // Remove correct answers before sending to client
            const clientQuiz = {
                ...quiz[0],
                questions: quiz[0].questions.map(q => ({
                    ...q,
                    correctAnswer: undefined
                }))
            };

            res.json(clientQuiz);
        } catch (error) {
            res.status(500).json({ message: 'Error generating quiz', error: error.message });
        }
    },

    // Submit quiz answers
    submitQuiz: async (req, res) => {
        try {
            const { quizId, answers } = req.body;
            const quiz = await Quiz.findById(quizId);

            if (!quiz) {
                return res.status(404).json({ message: 'Quiz not found' });
            }

            // Calculate score
            let score = 0;
            const results = quiz.questions.map((question, index) => {
                const isCorrect = question.correctAnswer === answers[index];
                if (isCorrect) score++;
                return {
                    question: question.question,
                    userAnswer: answers[index],
                    correctAnswer: question.correctAnswer,
                    isCorrect
                };
            });

            const scorePercentage = (score / quiz.questions.length) * 100;

            res.json({
                score: scorePercentage,
                totalQuestions: quiz.questions.length,
                correctAnswers: score,
                results
            });
        } catch (error) {
            res.status(500).json({ message: 'Error submitting quiz', error: error.message });
        }
    }
};

module.exports = quizController;