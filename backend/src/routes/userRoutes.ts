import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes with verifyToken
// In a real app, adding a requireRole('admin') middleware would be best practice
router.get('/', verifyToken, getUsers);
router.post('/', verifyToken, createUser);
router.put('/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, deleteUser);

export default router;
