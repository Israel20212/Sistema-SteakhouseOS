import { Request, Response } from 'express';
import Product from '../models/Product';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.findAll({
            where: { is_active: true }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, price, category, image_url, description } = req.body;

        // Basic Validation
        if (!name || !price || !category) {
            return res.status(400).json({ message: 'Nombre, precio y categoría son requeridos' });
        }

        const product = await Product.create({
            name,
            description: description || null,
            price: Number(price), // Ensure number
            category,
            image_url: image_url || null, // Handle empty string
            is_active: true, // Explicitly set active
            is_available: true // Explicitly set available
        });
        res.status(201).json(product);
    } catch (error: any) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const product = await Product.findByPk(Number(id));
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.update(req.body);

        // Notify clients
        io.emit('product_updated', product);

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const product = await Product.findByPk(Number(id));
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Soft delete
        product.is_active = false;
        await product.save();

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};

import { io } from '../index';

export const toggleAvailability = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const product = await Product.findByPk(Number(id));
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.is_available = !product.is_available;
        await product.save();

        // Notify clients
        io.emit('product_updated', product);

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling availability', error });
    }
};
