import { Router } from 'express';
import { signup, login } from '../controllers/authController.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, //10 requests
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/auth/signup', authLimiter, signup);
router.post('/auth/login', authLimiter, login);

export default router;
