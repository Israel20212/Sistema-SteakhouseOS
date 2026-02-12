import sequelize from '../config/database';
import { Product, Table, User } from '../models';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Authenticated.');

        await sequelize.sync({ force: true }); // Reset DB
        console.log('Database synced (tables dropped and recreated).');

        // Users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('123456', salt);

        console.log('Seeding users...');
        await User.bulkCreate([
            { username: 'admin', password_hash: password, role: 'admin' },
            { username: 'waiter', password_hash: password, role: 'waiter' },
            { username: 'kitchen', password_hash: password, role: 'kitchen' },
            { username: 'cashier', password_hash: password, role: 'cashier' }
        ]);
        console.log('Users seeded.');

        const tables = [];
        // Insert tables one by one to avoid bulk issues and better error tracking
        console.log('Seeding tables sequentially...');
        for (let i = 1; i <= 10; i++) {
            try {
                await Table.create({
                    number: String(i),
                    status: 'free' // Use 'free' as defined in model ENUM (not 'available')
                });
                console.log(`Table ${i} created.`);
            } catch (err) {
                console.error(`Failed to create table ${i}:`, err);
            }
        }
        console.log('Tables seeded.');

        // Products
        console.log('Seeding products...');
        await Product.bulkCreate([
            // Classics
            { name: 'Ribeye Premium 400g', price: 450, category: 'Carnes Premium', is_active: true, is_available: false, image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800&auto=format&fit=crop' },
            { name: 'New York Select 350g', price: 380, category: 'Carnes Premium', is_active: true, is_available: true, image_url: 'https://images.unsplash.com/photo-1594041680527-18f4cd5fecdf?q=80&w=800&auto=format&fit=crop' },
            { name: 'Tomahawk Gold 1.5kg', price: 1200, category: 'Carnes Premium', is_active: true, is_available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' },

            // Entries
            { name: 'Tuétanos a la Parrilla', price: 150, category: 'Entradas', is_active: true, is_available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' },
            { name: 'Carpaccio de Res', price: 200, category: 'Entradas', is_active: true, is_available: true, image_url: 'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=800&auto=format&fit=crop' },

            // Drinks
            { name: 'Vino Tinto Reserva', price: 120, category: 'Bebidas', is_active: true, is_available: true, image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800&auto=format&fit=crop' },
            { name: 'Limonada Mineral', price: 45, category: 'Bebidas', is_active: true, is_available: true, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop' }
        ]);

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
