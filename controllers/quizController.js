import Quiz from '../models/Quiz.js';
import Vocabulary from '../models/Vocabulary.js';
import Grammar from '../models/Grammar.js';

export const generateQuiz = async (req, res) => {
  try {
    const { type, count = 10 } = req.body;
    const user = req.user;
    
    let questions = [];
    
    if (type === 'vocabulary' || type === 'mixed') {
      const vocab = await Vocabulary.aggregate([
        { $match: { userId: user._id } },
        { $sample: { size: Math.floor(count/2) } }
      ]);
      questions.push(...vocab.map(q => ({
        type: 'vocabulary',
        question: q.word,
        correctAnswer: q.translation
      })));
    }
    
    if (type === 'grammar' || type === 'mixed') {
      const grammar = await Grammar.aggregate([
        { $match: { userId: user._id } },
        { $sample: { size: Math.ceil(count/2) } }
      ]);
      questions.push(...grammar.map(q => ({
        type: 'grammar',
        question: q.rule,
        correctAnswer: q.examples[0]
      })));
    }
    
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    let score = 0;
    const details = [];
    
    for (const answer of answers) {
      const isCorrect = answer.userAnswer === answer.correctAnswer;
      if (isCorrect) score++;
      details.push({
        question: answer.question,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect
      });
    }
    
    const quiz = new Quiz({
      type: req.body.type,
      score,
      totalQuestions: answers.length,
      details,
      userId: req.user.id
    });
    
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};