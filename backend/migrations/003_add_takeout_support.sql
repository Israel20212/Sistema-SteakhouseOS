-- Migration: Add order_type and make table_id nullable for takeout orders
-- Run this migration to support both dine-in and takeout orders

-- Add order_type column (default 'dine-in' for existing orders)
ALTER TABLE orders 
ADD COLUMN order_type ENUM('dine-in', 'takeout', 'pickup') NOT NULL DEFAULT 'dine-in';

-- Add customer_name column (optional, for takeout orders)
ALTER TABLE orders 
ADD COLUMN customer_name VARCHAR(100) NULL;

-- Make table_id nullable (for takeout orders that don't have a table)
ALTER TABLE orders 
MODIFY COLUMN table_id INT NULL;

-- Add index for faster filtering by order_type
CREATE INDEX idx_order_type ON orders(order_type);
