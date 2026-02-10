
import sequelize from '../config/database';
import { User } from '../models';

const fixRole = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Alter Table to add 'superuser' to ENUM
        console.log('Altering table users...');
        await sequelize.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('superuser', 'admin', 'waiter', 'kitchen', 'cashier') NOT NULL;
        `);
        console.log('Table altered.');

        // 2. Update the user
        const superuser = await User.findOne({ where: { username: 'superadmin' } });
        if (superuser) {
            // Force update via SQL to avoid model validation quirks if any, 
            // though model is already updated so standard update should work.
            // But since the current value is invalid (''), Sequelize might be confused.
            await sequelize.query(`
                UPDATE users SET role = 'superuser' WHERE username = 'superadmin';
            `);
            console.log('Superuser role updated to superuser.');
        } else {
            console.error('Superadmin user not found.');
        }

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        await sequelize.close();
    }
};

fixRole();
