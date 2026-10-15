-- Migration 001: Add stock tracking to products.
-- Existing products begin with zero stock until inventory is added.

ALTER TABLE products
ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;

ALTER TABLE products
ADD CONSTRAINT products_stock_quantity_check
CHECK (stock_quantity >= 0);