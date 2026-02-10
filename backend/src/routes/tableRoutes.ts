import { Router } from 'express';
import { getTables, updateTableStatus, occupyTable, requestPayment, cleanTable } from '../controllers/tableController';
import { verifyToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Allow all authenticated users to see tables, but maybe restrict updates later
router.get('/', verifyToken, getTables);
router.put('/:id/status', verifyToken, requireRole(['waiter', 'admin', 'cashier']), updateTableStatus);

// Admin Management
import { createTable, deleteTable } from '../controllers/tableController';
router.post('/', verifyToken, requireRole(['admin', 'superuser']), createTable);
router.delete('/:id', verifyToken, requireRole(['admin', 'superuser']), deleteTable);

// Table Lifecycle
router.post('/:id/occupy', verifyToken, requireRole(['waiter', 'admin', 'superuser']), occupyTable);
router.post('/:id/request-payment', verifyToken, requireRole(['waiter', 'admin', 'superuser']), requestPayment);
router.post('/:id/clean', verifyToken, requireRole(['waiter', 'admin', 'superuser']), cleanTable);

export default router;
