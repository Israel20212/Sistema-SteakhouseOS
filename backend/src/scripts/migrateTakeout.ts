import dotenv from 'dotenv';
import sequelize from '../config/database';

dotenv.config();

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Add order_type column
        await sequelize.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS order_type ENUM('dine-in', 'takeout', 'pickup') NOT NULL DEFAULT 'dine-in'
        `);
        console.log('✅ Added order_type column');

        // Add customer_name column
        await sequelize.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100) NULL
        `);
        console.log('✅ Added customer_name column');

        // Make table_id nullable
        await sequelize.query(`
            ALTER TABLE orders 
            MODIFY COLUMN table_id INT NULL
        `);
        console.log('✅ Made table_id nullable');

        // Add index
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_order_type ON orders(order_type)
        `);
        console.log('✅ Created index on order_type');

        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
