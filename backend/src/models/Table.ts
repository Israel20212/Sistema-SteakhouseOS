import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Table extends Model {
    public id!: number;
    public number!: string;
    public status!: 'free' | 'occupied' | 'waiting_food' | 'eating' | 'paying' | 'dirty';
    public current_order_id!: number | null;
}

Table.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM('free', 'occupied', 'waiting_food', 'eating', 'paying', 'dirty'),
            defaultValue: 'free',
        },
        current_order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'tables',
    }
);

export default Table;
