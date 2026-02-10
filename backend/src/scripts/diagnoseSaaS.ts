
import { User, Settings } from '../models';
import sequelize from '../config/database';

const diagnose = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Check Superuser
        const superuser = await User.findOne({ where: { username: 'superadmin' } });
        if (superuser) {
            console.log('Superuser found:', superuser.toJSON());
            console.log('Role:', superuser.role);
            if (superuser.role !== 'superuser') {
                console.error('CRITICAL: Superuser role is NOT superuser!');
            }
        } else {
            console.error('Superuser NOT found!');
        }

        // Check Settings
        const settings = await Settings.findOne();
        if (settings) {
            console.log('Settings found:', settings.toJSON());
        } else {
            console.warn('Settings NOT found!');
        }

    } catch (error) {
        console.error('Diagnostics failed:', error);
    } finally {
        await sequelize.close();
    }
};

diagnose();
