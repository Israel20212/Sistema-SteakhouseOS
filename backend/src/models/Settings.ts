import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Settings extends Model {
    public id!: number;
    public restaurant_name!: string;
    public logo_url!: string; // URL or Base64
    public primary_color!: string;
    public secondary_color!: string;
    public accent_color!: string;
    public is_active!: boolean; // SaaS subscription status

    // Ticket customization fields
    public ticket_slogan!: string;
    public ticket_address!: string;
    public ticket_phone!: string;
    public ticket_footer!: string;
    public ticket_footer_2!: string;
}

Settings.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        restaurant_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Steakhouse OS',
        },
        logo_url: {
            type: DataTypes.TEXT, // Text to allow base64 or long URLs
            allowNull: true,
        },
        primary_color: {
            type: DataTypes.STRING,
            defaultValue: '#000000', // Default Black
        },
        secondary_color: {
            type: DataTypes.STRING,
            defaultValue: '#FFFFFF', // Default White
        },
        accent_color: {
            type: DataTypes.STRING,
            defaultValue: '#D4AF37', // Default Gold
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        ticket_slogan: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: 'Prime Cuts & Drinks',
        },
        ticket_address: {
            type: DataTypes.STRING(200),
            allowNull: true,
            defaultValue: 'Calle Principal #123',
        },
        ticket_phone: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        ticket_footer: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: '¡Gracias por su visita!',
        },
        ticket_footer_2: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: 'Propina no incluida',
        },
    },
    {
        sequelize,
        tableName: 'settings',
    }
);

export default Settings;
