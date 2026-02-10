
import { User } from '../models';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

const resetPasswords = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('123', salt);

        // Update all users
        const [updatedRows] = await User.update(
            { password_hash },
            { where: {} } // Apply to all rows
        );

        console.log(`Successfully updated passwords for ${updatedRows} users.`);
        console.log('All passwords are now: "123"');

    } catch (error) {
        console.error('Error resetting passwords:', error);
    } finally {
        await sequelize.close();
    }
};

resetPasswords();
