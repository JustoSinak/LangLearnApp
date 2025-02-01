const Vocabulary = require('../models/Vocabulary');

const vocabularyController = {

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
      await newWord.save();
      res.status(201).json(newWord);
    } catch (error) {
      res.status(500).json({ message: 'Error adding word', error: error.message });
    }
  },


  getQuiz: async (req, res) => {
    try {
      const { difficulty, category } = req.query;
      const words = await Vocabulary.aggregate([
        { $match: { difficulty } },
        { $sample: { size: 10 } }
      ]);

      


      // const query = {};
      
      // if (difficulty) query.difficulty = difficulty;
      // if (category) query.category = category;
      
      // const words = await Vocabulary.find(query);
      
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

};

module.exports = vocabularyController;