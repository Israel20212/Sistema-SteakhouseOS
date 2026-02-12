import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'role', 'createdAt'] // Do not return password_hash
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            password_hash,
            role
        });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            role: newUser.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username, password, role } = req.body;

        const user = await User.findByPk(Number(id));
        if (!user) return res.status(404).json({ message: 'User not found' });

        // PROTECT SUPERUSER: Prevent modification of the root admin
        if (user.role === 'superuser') {
            return res.status(403).json({
                message: 'ACCIÓN DENEGADA: El Superusuario principal no puede ser modificado.',
                error: 'Forbidden: Cannot update superuser'
            });
        }

        if (username) user.username = username;
        if (role) user.role = role;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.json({
            id: user.id,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(Number(id));

        if (!user) return res.status(404).json({ message: 'User not found' });

        // PROTECT SUPERUSER: Prevent deletion of the root admin
        if (user.role === 'superuser') {
            return res.status(403).json({
                message: 'ACCIÓN DENEGADA: El Superusuario principal no puede ser eliminado por razones de seguridad.',
                error: 'Forbidden: Cannot delete superuser'
            });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};
