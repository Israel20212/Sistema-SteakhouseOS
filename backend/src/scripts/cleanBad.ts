
import sequelize from '../config/database';
import Table from '../models/Table';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

const cleanTables = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Delete all tables where ID is greater than 10 (Assuming 1-10 are the valid seeds)
        // Or better, check the 'number' string length or value

        const tables = await Table.findAll();
        let count = 0;

        for (const table of tables) {
            const num = parseInt(table.number);
            if (num > 10) {
                console.log(`Deleting invalid table Mesa ${table.number}`);
                await table.destroy();
                count++;
            }
        }

        console.log(`Cleaned up ${count} invalid tables.`);
    } catch (error) {
        console.error('Error cleaning tables:', error);
    } finally {
        await sequelize.close();
    }
};

cleanTables();
