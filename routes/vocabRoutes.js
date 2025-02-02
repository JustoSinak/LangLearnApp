import express from 'express';
import { protect } from '../middleware/auth.js';
import { addWord, getWords } from '../controllers/vocabController.js';

const router = express.Router();

router.use(protect);

router.post('/', addWord);
router.get('/', getWords);

export default router;