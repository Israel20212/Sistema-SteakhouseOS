
import { Router } from 'express';
import { getSettings, updateSettings, resetSettings } from '../controllers/settingsController';
import { verifyToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public read (for loading app)
router.get('/', getSettings);

// Protected update (Superuser only)
router.put('/', verifyToken, requireRole(['superuser']), updateSettings);
router.post('/reset', verifyToken, requireRole(['superuser']), resetSettings);

export default router;
