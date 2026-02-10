import dotenv from 'dotenv';
import sequelize from '../config/database';
import Product from '../models/Product';

dotenv.config();

async function activateAllProducts() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const result = await Product.update(
            {
                is_active: true,
                is_available: true
            },
            {
                where: {} // Update all products
            }
        );

        console.log(`✅ Activated ${result[0]} products`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

activateAllProducts();
