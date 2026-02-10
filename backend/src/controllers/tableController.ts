import { Request, Response } from 'express';
import Table from '../models/Table';
import Order from '../models/Order';
import { io } from '../index';

export const getTables = async (req: Request, res: Response) => {
    try {
        const tables = await Table.findAll({
            order: [['id', 'ASC']], // Ensure consistent order
        });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tables', error });
    }
};

export const updateTableStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const table = await Table.findByPk(Number(id));
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }

        table.status = status;
        await table.save();

        res.json(table);
    } catch (error) {
        res.status(500).json({ message: 'Error updating table', error });
    }
};

export const createTable = async (req: Request, res: Response) => {
    try {
        // Fetch all tables to manually find the highest number
        // (Avoiding string sorting issues in DB: "10" < "2")
        const tables = await Table.findAll({ attributes: ['number'] });
        const numbers = tables.map(t => parseInt(t.number)).filter(n => !isNaN(n));

        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        const nextNumber = String(maxNumber + 1);

        const newTable = await Table.create({
            number: nextNumber,
            status: 'free'
        });

        res.status(201).json(newTable);
    } catch (error: any) {
        console.error('Error creating table:', error);
        res.status(500).json({ message: 'Error creating table', error: error.message });
    }
};

export const deleteTable = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const table = await Table.findByPk(Number(id));
        if (!table) return res.status(404).json({ message: 'Table not found' });

        // Optional: Check if active orders exist before deleting?
        // For now, allow deletion (cascading might handle orders if configured, or they remain orphaned)

        await table.destroy();
        res.json({ message: 'Table deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting table', error });
    }
};

// Mark free table as occupied (customer seated)
export const occupyTable = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const table = await Table.findByPk(Number(id));
        if (!table) return res.status(404).json({ message: 'Table not found' });

        if (table.status !== 'free') {
            return res.status(400).json({ message: 'Table is not free' });
        }

        table.status = 'occupied';
        await table.save();

        io.emit('table_updated', table);
        res.json(table);
    } catch (error) {
        res.status(500).json({ message: 'Error occupying table', error });
    }
};

// Request payment (eating → paying)
export const requestPayment = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const table = await Table.findByPk(Number(id));
        if (!table) return res.status(404).json({ message: 'Table not found' });

        if (table.status !== 'eating') {
            return res.status(400).json({ message: 'Table is not in eating status' });
        }

        table.status = 'paying';
        await table.save();

        io.emit('table_updated', table);
        res.json(table);
    } catch (error) {
        res.status(500).json({ message: 'Error requesting payment', error });
    }
};

// Clean table (dirty → free)
export const cleanTable = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const table = await Table.findByPk(Number(id));
        if (!table) return res.status(404).json({ message: 'Table not found' });

        if (table.status !== 'dirty') {
            return res.status(400).json({ message: 'Table is not dirty' });
        }

        table.status = 'free';
        await table.save();

        io.emit('table_updated', table);
        res.json(table);
    } catch (error) {
        res.status(500).json({ message: 'Error cleaning table', error });
    }
};
