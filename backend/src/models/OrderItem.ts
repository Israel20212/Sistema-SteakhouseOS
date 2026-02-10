import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class OrderItem extends Model {
    public id!: number;
    public order_id!: number;
    public product_id!: number;
    public quantity!: number;
    public price_at_moment!: number;
}

OrderItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        price_at_moment: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'order_items',
    }
);

export default OrderItem;
