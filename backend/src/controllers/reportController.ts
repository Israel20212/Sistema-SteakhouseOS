import { Request, Response } from 'express';
import { Order, OrderItem, Product } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';

export const getStats = async (req: Request, res: Response) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Total Sales Today
        const totalSales = await Order.sum('total', {
            where: {
                status: 'paid',
                createdAt: {
                    [Op.between]: [todayStart, todayEnd]
                }
            }
        });

        // 2. Total Orders Today (Paid)
        const totalOrders = await Order.count({
            where: {
                status: 'paid',
                createdAt: {
                    [Op.between]: [todayStart, todayEnd]
                }
            }
        });

        // 3. Active Orders (Kitchen/Pending)
        const activeOrders = await Order.count({
            where: {
                status: ['pending', 'cooking', 'ready', 'served']
            }
        });

        // 4. Returns
        res.json({
            sales: totalSales || 0,
            orders: totalOrders || 0,
            active: activeOrders || 0,
            averageTicket: totalOrders > 0 ? (totalSales / totalOrders) : 0
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

export const getTopProducts = async (req: Request, res: Response) => {
    try {
        // Top 5 products by quantity sold (all time or today? let's do all time for now)
        const topProducts = await OrderItem.findAll({
            attributes: [
                'product_id',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
            ],
            include: [
                { model: Product, attributes: ['name', 'price'] }
            ],
            group: ['product_id', 'Product.id'], // Group by both FK and PK of joined table
            order: [[sequelize.literal('total_quantity'), 'DESC']],
            limit: 5
        });

        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ message: 'Error fetching top products', error });
    }
};
