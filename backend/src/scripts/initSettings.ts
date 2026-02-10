
import { Settings } from '../models';
import sequelize from '../config/database';

const initSettings = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync model to ensure table exists (or use migrations in prod)
        await Settings.sync({ alter: true });

        const [settings, created] = await Settings.findOrCreate({
            where: { id: 1 },
            defaults: {
                restaurant_name: 'Steakhouse OS',
                theme_color: '#D4AF37',
                is_active: true
            }
        });

        if (created) {
            console.log('Default settings created.');
        } else {
            console.log('Settings already exist:', settings.toJSON());
        }

    } catch (error) {
        console.error('Error initializing settings:', error);
    } finally {
        await sequelize.close();
    }
};

initSettings();
