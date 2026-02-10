import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleAvailability } from '../controllers/productController';
import { verifyToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public (or protected if preferred, but public for menu display usually)
router.get('/', getProducts);

// Admin only
router.post('/', verifyToken, createProduct);
router.put('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);
router.patch('/:id/availability', verifyToken, toggleAvailability);

export default router;
