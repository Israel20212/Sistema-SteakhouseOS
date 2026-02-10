import sequelize from '../config/database';
import '../models/index'; // Import associations

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync with alter: true to update tables without dropping
        await sequelize.sync({ alter: true });

        console.log('Database synchronized successfully (Schema Update).');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

syncDatabase();
