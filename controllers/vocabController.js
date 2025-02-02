import Vocabulary from '../models/Vocabulary.js';

export const addWord = async (req, res) => {
  try {
    const { word, translation, examples } = req.body;
    const newWord = new Vocabulary({
      word,
      translation,
      examples,
      userId: req.user.id
    });
    await newWord.save();
    res.status(201).json(newWord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getWords = async (req, res) => {
  try {
    const words = await Vocabulary.find({ userId: req.user.id });
    res.json(words);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};