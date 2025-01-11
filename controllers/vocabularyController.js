const Vocabulary = require('../models/Vocabulary');

const vocabularyController = {
  getWords: async (req, res) => {
    try {
      const { difficulty, category } = req.query;
      const query = {};
      
      if (difficulty) query.difficulty = difficulty;
      if (category) query.category = category;
      
      const words = await Vocabulary.find(query);
      res.json(words);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  addWord: async (req, res) => {
    try {
      const { word, definition, examples, difficulty, category } = req.body;
      const newWord = await Vocabulary.create({
        word,
        definition,
        examples,
        difficulty,
        category
      });
      
      res.status(201).json(newWord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = vocabularyController;