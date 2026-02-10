import sequelize from '../config/database';
import User from './User';
import Product from './Product';
import Table from './Table';
import Order from './Order';
import OrderItem from './OrderItem';
import Settings from './Settings';

// Relationships
Table.hasOne(Order, { foreignKey: 'table_id', as: 'CurrentOrder' });
Order.belongsTo(Table, { foreignKey: 'table_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

export {
    sequelize,
    User,
    Product,
    Table,
    Order,
    OrderItem,
    Settings
};
