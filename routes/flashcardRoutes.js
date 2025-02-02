import express from 'express';
import { protect } from '../middleware/auth.js';
import { createFlashcard, updateFlashcard, getDueCards } from '../controllers/flashcardController.js';

const router = express.Router();

router.use(protect);

router.post('/', createFlashcard);
router.get('/due', getDueCards);
router.put('/:id', updateFlashcard);

export default router;