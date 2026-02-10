
import sequelize from '../config/database';
import { Order, Product, OrderItem } from '../models';
import dotenv from 'dotenv';

dotenv.config();

const checkData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const productCount = await Product.count();
        console.log(`Products in DB: ${productCount}`);

        const orderCount = await Order.count();
        console.log(`Orders in DB: ${orderCount}`);

        const orderItemCount = await OrderItem.count();
        console.log(`OrderItems in DB: ${orderItemCount}`);

        if (productCount === 0) {
            console.log('CRITICAL: No products found. seeding orders requires products.');
        }

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await sequelize.close();
    }
};

checkData();
