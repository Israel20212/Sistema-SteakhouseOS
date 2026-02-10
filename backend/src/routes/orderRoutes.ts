import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus, payOrder, getActiveOrders, placePublicOrder } from '../controllers/orderController';
import { createTakeoutOrder } from '../controllers/takeoutController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', verifyToken, createOrder);
router.post('/public', placePublicOrder); // Public endpoint for QR code table orders
router.post('/takeout', createTakeoutOrder); // Public endpoint for takeout orders (no table)
router.get('/', verifyToken, getOrders); // For Kitchen (Pending/Cooking)
router.get('/active', verifyToken, getActiveOrders); // For Cashier (All active)
router.post('/:id/pay', verifyToken, payOrder);
router.put('/:id/status', verifyToken, updateOrderStatus);

export default router;
