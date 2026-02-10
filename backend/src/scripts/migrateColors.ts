
import sequelize from '../config/database';

const migrateColors = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Altering table settings...');

        // Remove old column
        try {
            await sequelize.query(`ALTER TABLE settings DROP COLUMN theme_color;`);
        } catch (e) {
            console.log('theme_color might handle been already dropped or not exist.');
        }

        // Add new columns
        await sequelize.query(`
            ALTER TABLE settings 
            ADD COLUMN primary_color VARCHAR(255) DEFAULT '#000000',
            ADD COLUMN secondary_color VARCHAR(255) DEFAULT '#FFFFFF',
            ADD COLUMN accent_color VARCHAR(255) DEFAULT '#D4AF37';
        `);

        console.log('Table settings updated with 3 color system.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
};

migrateColors();
