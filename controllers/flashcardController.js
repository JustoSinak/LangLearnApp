import Flashcard from '../models/Flashcard.js';

const calculateNextReview = (interval, difficulty) => {
  const easeFactor = 1.3 + (0.1 - (5 - difficulty) * (0.08 + (5 - difficulty) * 0.02));
  const newInterval = Math.round(interval * easeFactor);
  return new Date(Date.now() + newInterval * 86400000);
};

export const createFlashcard = async (req, res) => {
  try {
    const { front, back, category } = req.body;
    const flashcard = new Flashcard({
      front,
      back,
      category,
      userId: req.user.id
    });
    await flashcard.save();
    res.status(201).json(flashcard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateFlashcard = async (req, res) => {
  try {
    const { difficulty } = req.body;
    const flashcard = await Flashcard.findById(req.params.id);
    
    flashcard.repetitions += 1;
    flashcard.difficulty = difficulty;
    flashcard.interval = calculateNextReview(flashcard.interval, difficulty);
    flashcard.nextReview = calculateNextReview(flashcard.interval, difficulty);
    
    await flashcard.save();
    res.json(flashcard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getDueCards = async (req, res) => {
  try {
    const cards = await Flashcard.find({
      userId: req.user.id,
      nextReview: { $lte: new Date() }
    });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};