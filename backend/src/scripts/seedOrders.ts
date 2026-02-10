
import sequelize from '../config/database';
import { Order, OrderItem, Product } from '../models';
import dotenv from 'dotenv';

dotenv.config();

const seedOrders = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Fetch products to sell
        const products = await Product.findAll();
        if (products.length === 0) {
            console.log('No products found. Run seedDb first.');
            return;
        }

        // Fetch a table to assign orders to
        const tables = await sequelize.models.Table.findAll();
        const tableId = tables.length > 0 ? tables[0].getDataValue('id') : 1;

        // Create a few sales
        const salesData = [
            { total: 500, items: [products[0], products[0]] },
            { total: 1200, items: [products[1], products[2], products[2]] },
            { total: 350, items: [products[0]] }
        ];

        for (const sale of salesData) {
            const order = await Order.create({
                table_id: tableId, // Assign valid table
                status: 'paid',
                total: sale.total
            });

            for (const item of sale.items) {
                await OrderItem.create({
                    order_id: order.id,
                    product_id: item.id,
                    quantity: 1,
                    price_at_moment: item.price
                });
            }
        }

        console.log('Dummy sales created successfully.');
    } catch (error) {
        console.error('Error seeding orders:', error);
    } finally {
        await sequelize.close();
    }
};

seedOrders();
