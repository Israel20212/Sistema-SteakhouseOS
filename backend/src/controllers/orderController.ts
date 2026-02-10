import { Request, Response } from 'express';
import { Order, OrderItem, Table, Product } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';
import { io } from '../index'; // Import socket instance

export const createOrder = async (req: Request, res: Response) => {
    const { tableId, items } = req.body;
    const t = await sequelize.transaction();

    try {
        let total = 0;
        const validItems = [];

        // Validate products and calc total
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (product) {
                total += Number(product.price) * item.quantity;
                validItems.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    price_at_moment: product.price
                });
            }
        }

        const order = await Order.create({
            table_id: tableId,
            total,
            status: 'pending' // Default status per model
        }, { transaction: t });

        for (const item of validItems) {
            await OrderItem.create({
                order_id: order.id,
                ...item
            }, { transaction: t });
        }

        // Update Table Status
        const table = await Table.findByPk(tableId, { transaction: t });
        if (table) {
            table.status = 'waiting_food';
            table.current_order_id = order.id;
            await table.save({ transaction: t });
        }

        await t.commit();

        // Fetch full order for socket
        const fullOrder = await Order.findByPk(order.id, {
            include: [
                { model: Table },
                {
                    model: OrderItem,
                    include: [{ model: Product }]
                }
            ]
        });

        // Emit events
        io.emit('new_order', fullOrder); // Notify Kitchen & Cashier
        io.emit('table_updated', table); // Notify Waiters

        res.status(201).json(order);
    } catch (error: any) {
        await t.rollback();
        res.status(500).json({ message: 'Error creating order', error });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        // Fetch active orders for Kitchen View
        const orders = await Order.findAll({
            where: {
                status: ['pending', 'cooking']
            },
            include: [
                { model: Table },
                {
                    model: OrderItem,
                    include: [{ model: Product }]
                }
            ],
            order: [['createdAt', 'ASC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'cooking', 'ready', 'served'

    try {
        const order = await Order.findByPk(Number(id), {
            include: [{ model: Table }]
        });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        await order.save();

        // Update Table mapping if needed (e.g. eating) - Only for dine-in orders
        if (status === 'served' && order.table_id) {
            const table = await Table.findByPk(order.table_id);
            if (table) {
                table.status = 'eating';
                await table.save();
                io.emit('table_updated', table);
            }
        }

        io.emit('order_updated', order); // Notify Cashier/Kitchen

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order', error });
    }
};

export const getActiveOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.findAll({
            where: {
                status: {
                    // @ts-ignore
                    [Op.not]: 'paid'
                }
            },
            include: [
                { model: Table },
                {
                    model: OrderItem,
                    include: [{ model: Product }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching active orders', error });
    }
};

export const payOrder = async (req: Request, res: Response) => {
    const { id } = req.params;
    const t = await sequelize.transaction();

    try {
        const order = await Order.findByPk(Number(id), { transaction: t });
        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = 'paid';
        await order.save({ transaction: t });

        // Update Table - Only for dine-in orders with table
        if (order.table_id) {
            const table = await Table.findByPk(order.table_id, { transaction: t });
            if (table) {
                table.status = 'dirty'; // Table needs cleaning before next use
                table.current_order_id = null; // Clear current order
                await table.save({ transaction: t });

                io.emit('table_updated', table);
            }
        }

        await t.commit();

        io.emit('order_paid', { orderId: order.id });

        res.json({ message: 'Order paid successfully', order });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Payment failed', error });
    }
};

export const placePublicOrder = async (req: Request, res: Response) => {
    const { tableId, items } = req.body;
    const t = await sequelize.transaction();

    try {
        const table = await Table.findByPk(tableId, { transaction: t });
        if (!table) {
            await t.rollback();
            return res.status(404).json({ message: 'Table not found' });
        }

        let order;
        let isNewOrder = false;

        // Check for active order
        if (table.current_order_id) {
            order = await Order.findByPk(table.current_order_id, { transaction: t });
            if (order && order.status === 'paid') {
                // If previous order was paid but table not released properly, start new
                order = null;
            }
        }

        if (!order) {
            isNewOrder = true;
            order = await Order.create({
                table_id: tableId,
                total: 0, // Will update below
                status: 'pending'
            }, { transaction: t });
        } else {
            // Reactivate order if it was served
            if (['served', 'ready'].includes(order.status)) {
                order.status = 'cooking'; // Set back to cooking/pending so kitchen sees new items
                await order.save({ transaction: t });
            }
        }

        let itemsTotal = 0;
        const validItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (product && product.is_active && product.is_available) {
                const price = Number(product.price);
                itemsTotal += price * item.quantity;

                validItems.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    price_at_moment: price
                });
            }
        }

        // Add items
        for (const item of validItems) {
            await OrderItem.create({
                order_id: order.id,
                ...item
            }, { transaction: t });
        }

        // Update Order Total
        order.total = Number(order.total) + itemsTotal;
        await order.save({ transaction: t });

        // Update Table
        table.status = 'waiting_food';
        if (isNewOrder) table.current_order_id = order.id;
        await table.save({ transaction: t });

        await t.commit();

        // Fetch full for socket
        const fullOrder = await Order.findByPk(order.id, {
            include: [
                { model: Table },
                {
                    model: OrderItem,
                    include: [{ model: Product }]
                }
            ]
        });

        // Notify
        if (isNewOrder) {
            io.emit('new_order', fullOrder);
        } else {
            io.emit('order_updated', fullOrder);
        }
        io.emit('table_updated', table);

        res.status(201).json({ message: 'Order placed', order: fullOrder });

    } catch (error) {
        await t.rollback();
        console.error('Error placing public order:', error);
        res.status(500).json({ message: 'Error placing order', error });
    }
};
