
import { Request, Response } from 'express';
import { Settings, OrderItem, Order, Product, Table } from '../models';

export const getSettings = async (req: Request, res: Response) => {
    try {
        // Always fetch the first row
        let settings = await Settings.findOne();
        if (!settings) {
            // Should be seeded, but fallback just in case
            settings = await Settings.create({
                restaurant_name: 'Steakhouse OS',
                primary_color: '#000000',
                secondary_color: '#FFFFFF',
                accent_color: '#D4AF37'
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            await settings.update(req.body);
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
};

export const resetSettings = async (req: Request, res: Response) => {
    try {
        // 1. Destructive Data Wipe
        // 1. Destructive Data Wipe with FK Toggle
        await Settings.sequelize?.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });

        await OrderItem.destroy({ truncate: true, cascade: true });
        await Order.destroy({ truncate: true, cascade: true });
        await Product.destroy({ truncate: true, cascade: true });
        await Table.destroy({ truncate: true, cascade: true });

        await Settings.sequelize?.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });

        console.log('Operational data wiped successfully.');

        // 2. Reset Settings to Factory Defaults
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({
                restaurant_name: 'Steakhouse OS',
                primary_color: '#000000',
                secondary_color: '#FFFFFF',
                accent_color: '#D4AF37',
                logo_url: ''
            });
        } else {
            settings.restaurant_name = 'Steakhouse OS';
            settings.primary_color = '#000000';
            settings.secondary_color = '#FFFFFF';
            settings.accent_color = '#D4AF37';
            settings.logo_url = '';
            await settings.save();
        }

        res.json({ message: 'Factory reset completed successfully. System is clean.', settings });

    } catch (error) {
        console.error('Factory reset failed:', error);
        res.status(500).json({ message: 'Factory reset failed', error });
    }
};
