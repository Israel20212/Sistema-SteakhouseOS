
import { User } from '../models';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

const createSuperuser = async () => {
    try {
        await sequelize.authenticate();

        const username = 'superadmin';
        const password = 'superuser123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const [user, created] = await User.findOrCreate({
            where: { username },
            defaults: {
                password_hash: hashedPassword,
                // @ts-ignore - Bypass strict enum check in TS if needed, or ensure model is updated
                role: 'superuser'
            }
        });

        if (created) {
            console.log(`Superuser created: ${username} / ${password}`);
        } else {
            console.log('Superuser already exists.');
        }

    } catch (error) {
        console.error('Error creating superuser:', error);
    } finally {
        await sequelize.close();
    }
};

createSuperuser();
