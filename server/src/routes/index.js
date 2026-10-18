import { Router } from 'express';
import authRouter from './auth.js';
import publicRouter from './public.js';
import studentRouter from './student.js';
import staffRouter from './staff.js';
import cronRouter from './cron.js';

const router = Router();

// Health check endpoint (pure Express, no DB call)
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Mount sub-routers
router.use('/auth', authRouter);
router.use('/public', publicRouter);
router.use('/me', studentRouter);
router.use('/staff', staffRouter);
router.use('/cron', cronRouter);

export default router;
