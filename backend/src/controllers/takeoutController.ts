import { Request, Response } from 'express';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Product from '../models/Product';
import sequelize from '../config/database';
import { io } from '../index';

// Create takeout order (no table required)
export const createTakeoutOrder = async (req: Request, res: Response) => {
    const { items, customer_name } = req.body;
    const t = await sequelize.transaction();

    try {
        // Validate items
        if (!items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Order must have at least one item' });
        }

        // Validate customer name is provided
        if (!customer_name || !customer_name.trim()) {
            await t.rollback();
            return res.status(400).json({ message: 'Customer name is required for takeout orders' });
        }

        // Create order without table
        const order = await Order.create({
            table_id: null, // No table for takeout
            order_type: 'takeout',
            customer_name: customer_name || null,
            total: 0, // Will calculate below
            status: 'pending'
        }, { transaction: t });

        let itemsTotal = 0;
        const validItems = [];

        // Add items to order
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (product && product.is_active && product.is_available) {
                const quantity = Number(item.quantity);
                const subtotal = Number(product.price) * quantity;

                await OrderItem.create({
                    order_id: order.id,
                    product_id: product.id,
                    quantity,
                    price_at_moment: product.price
                }, { transaction: t });

                itemsTotal += subtotal;
                validItems.push({
                    product: product.name,
                    quantity,
                    price: product.price
                });
            }
        }

        // Update total
        order.total = itemsTotal;
        await order.save({ transaction: t });

        await t.commit();

        // Emit to kitchen and other clients
        const orderWithItems = await Order.findByPk(order.id, {
            include: [{
                model: OrderItem,
                include: [{ model: Product, attributes: ['id', 'name'] }]
            }]
        });

        io.emit('new_order', orderWithItems);

        res.status(201).json({
            message: 'Takeout order created successfully',
            orderId: order.id,
            total: order.total,
            items: validItems
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating takeout order:', error);
        res.status(500).json({ message: 'Error creating takeout order', error });
    }
};
