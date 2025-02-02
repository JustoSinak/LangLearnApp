import express from 'express';
import { protect } from '../middleware/auth.js';
import { createExercise, getExercises } from '../controllers/grammarController.js';

const router = express.Router();

router.use(protect);

router.post('/', createExercise);
router.get('/', getExercises);

export default router;