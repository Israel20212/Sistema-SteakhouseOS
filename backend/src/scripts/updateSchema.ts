import sequelize from '../config/database';
import '../models/index'; // Import associations

const updateSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync with alter: true to add 'description' column
        await sequelize.sync({ alter: true });

        console.log('Schema updated successfully (Description Added).');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

updateSchema();
