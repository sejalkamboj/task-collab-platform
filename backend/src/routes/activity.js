import express from 'express';
import { getBoardActivity } from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/board/:boardId', getBoardActivity);

export default router;
