import sequelize from './config/database';
import { User, Product, Table, Order, OrderItem } from './models';
import bcrypt from 'bcryptjs';

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Disable foreign key checks to allow dropping tables without order constraints
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Force sync will drop tables if they exist! Use with caution in prod.
        // For dev initial setup, it's fine.
        await sequelize.sync({ force: true });

        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Database synchronized.');

        // Seed Data - Users
        // Admin User
        await User.create({
            username: 'admin',
            password_hash: await bcrypt.hash('admin123', 10),
            role: 'admin'
        });
        console.log('User admin created');

        // Waiter User
        await User.create({
            username: 'waiter',
            password_hash: await bcrypt.hash('waiter123', 10),
            role: 'waiter'
        });
        console.log('User waiter created');

        // Kitchen User
        await User.create({
            username: 'kitchen',
            password_hash: await bcrypt.hash('kitchen123', 10),
            role: 'kitchen'
        });
        console.log('User kitchen created');

        // Cashier User
        await User.create({
            username: 'cashier',
            password_hash: await bcrypt.hash('cashier123', 10),
            role: 'cashier'
        });
        console.log('User cashier created');

        // Seed Tables
        const tables = Array.from({ length: 10 }, (_, i) => ({
            number: `M-${i + 1}`,
            status: 'free'
        }));
        await Table.bulkCreate(tables as any);
        console.log('Tables created');

        // Seed Products
        await Product.bulkCreate([
            { name: 'Ribeye Premium 400g', price: 650.00, category: 'Cortes', image_url: 'https://placehold.co/400/1a1a1a/D4AF37?text=Ribeye' },
            { name: 'New York Select 350g', price: 580.00, category: 'Cortes', image_url: 'https://placehold.co/400/1a1a1a/D4AF37?text=New+York' },
            { name: 'Tomahawk Gold 1.2kg', price: 2100.00, category: 'Cortes', image_url: 'https://placehold.co/400/1a1a1a/gold?text=Tomahawk' },
            { name: 'Hamburguesa Wagyu', price: 350.00, category: 'Entradas', image_url: 'https://placehold.co/400/1a1a1a/D4AF37?text=Burger' },
            { name: 'Vino Tinto Reserva', price: 1200.00, category: 'Bebidas', image_url: 'https://placehold.co/400/1a1a1a/900?text=Vino' },
            { name: 'Cerveza Artesanal', price: 95.00, category: 'Bebidas', image_url: 'https://placehold.co/400/1a1a1a/D4AF37?text=Beer' },
            { name: 'Papas Trufadas', price: 140.00, category: 'Guarniciones', image_url: 'https://placehold.co/400/1a1a1a/D4AF37?text=Fries' },
            { name: 'Espárragos a la Parrilla', price: 110.00, category: 'Guarniciones', image_url: 'https://placehold.co/400/1a1a1a/green?text=Asparagus' },
        ]);
        console.log('Products created');

        console.log('Seed data setup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database or sync:', error);
        process.exit(1);
    }
};

syncDatabase();
