import Grammar from '../models/Grammar.js';

export const createExercise = async (req, res) => {
  try {
    const { rule, examples, exerciseType } = req.body;
    const exercise = new Grammar({
      rule,
      examples,
      exerciseType,
      userId: req.user.id,
      language: req.user.learningLanguage
    });
    await exercise.save();
    res.status(201).json(exercise);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getExercises = async (req, res) => {
  try {
    const exercises = await Grammar.find({ userId: req.user.id });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};