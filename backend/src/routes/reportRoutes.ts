import { Router } from 'express';
import { getStats, getTopProducts } from '../controllers/reportController';

const router = Router();

// In a real app, you would add authentication middleware here:
// import { authenticateToken, requireRole } from '../middleware/authMiddleware';
// router.get('/stats', authenticateToken, requireRole('admin'), getStats);

router.get('/stats', getStats);
router.get('/top-products', getTopProducts);

export default router;
