import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Order extends Model {
    public id!: number;
    public table_id!: number | null;
    public status!: 'pending' | 'cooking' | 'ready' | 'served' | 'paid';
    public total!: number;
    public order_type!: 'dine-in' | 'takeout' | 'pickup';
    public customer_name!: string | null;
}

Order.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        table_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Nullable for takeout orders
        },
        status: {
            type: DataTypes.ENUM('pending', 'cooking', 'ready', 'served', 'paid'),
            defaultValue: 'pending',
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        order_type: {
            type: DataTypes.ENUM('dine-in', 'takeout', 'pickup'),
            defaultValue: 'dine-in',
        },
        customer_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'orders',
    }
);

export default Order;
