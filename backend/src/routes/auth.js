import express from 'express';
import { signup, login, refresh, getMe } from '../controllers/authController.js';
import { validate, signupSchema, loginSchema } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);

export default router;
