import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';

async function migrateTicketSettings() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Add ticket customization columns to settings table
        const queries = [
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ticket_slogan VARCHAR(100) DEFAULT 'Prime Cuts & Drinks'`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ticket_address VARCHAR(200) DEFAULT 'Calle Principal #123'`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ticket_phone VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ticket_footer VARCHAR(100) DEFAULT '¡Gracias por su visita!'`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ticket_footer_2 VARCHAR(100) DEFAULT 'Propina no incluida'`
        ];

        for (const query of queries) {
            try {
                await sequelize.query(query);
                console.log(`✅ Executed: ${query.substring(0, 60)}...`);
            } catch (err: any) {
                if (err.message.includes('Duplicate column')) {
                    console.log(`⚠️  Column already exists, skipping...`);
                } else {
                    throw err;
                }
            }
        }

        console.log('\n🎉 Ticket settings migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

migrateTicketSettings();
