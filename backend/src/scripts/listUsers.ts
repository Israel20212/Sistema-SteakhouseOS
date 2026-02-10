
import { User } from '../models';
import sequelize from '../config/database';

const listUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const users = await User.findAll({
            attributes: ['id', 'username', 'role', 'createdAt']
        });

        const fs = require('fs');
        const list = users.map(u => `${u.id} | ${u.username} | ${u.role}`).join('\n');
        fs.writeFileSync('users.txt', list);
        console.log('Users written to users.txt');

    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await sequelize.close();
    }
};

listUsers();
