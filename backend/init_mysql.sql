-- ==========================================================
-- StockWise Inventory Intelligence Database Setup (MySQL)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS stockwise_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stockwise_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Administrator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 4. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    lead_time INT DEFAULT 7,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    stock INT DEFAULT 0,
    min INT DEFAULT 1,
    price DOUBLE DEFAULT 0.0,
    supplier VARCHAR(150) NOT NULL,
    location VARCHAR(100) DEFAULT 'Store Room',
    barcode VARCHAR(100) DEFAULT '',
    expiry VARCHAR(50) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_barcode (barcode)
);

-- 6. Movements Table
CREATE TABLE IF NOT EXISTS movements (
    id VARCHAR(50) PRIMARY KEY,
    product VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    qty INT NOT NULL,
    date VARCHAR(50) NOT NULL,
    reason VARCHAR(255) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    supplier VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    received BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Purchase Order Lines Table
CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- 9. Transfers Table
CREATE TABLE IF NOT EXISTS transfers (
    id VARCHAR(50) PRIMARY KEY,
    product VARCHAR(150) NOT NULL,
    from_location VARCHAR(100) NOT NULL,
    to_location VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    `value` TEXT NOT NULL
);

-- ==========================================================
-- Initial Seed Data
-- ==========================================================

-- Seed Categories
INSERT IGNORE INTO categories (name) VALUES 
('Electronics'), ('Sensors'), ('Accessories'), ('Peripherals');

-- Seed Brands
INSERT IGNORE INTO brands (name) VALUES 
('Arduino'), ('Circuit Hub'), ('OfficeKart'), ('Logitech'), ('Keychron');

-- Seed Suppliers
INSERT IGNORE INTO suppliers (id, name, email, phone, lead_time) VALUES
('SUP-001', 'TechSource India', 'contact@techsource.demo', '+91 98765 11111', 7),
('SUP-002', 'Circuit Hub', 'orders@circuithub.demo', '+91 98765 22222', 10),
('SUP-003', 'OfficeKart', 'sales@officekart.demo', '+91 98765 33333', 5);

-- Seed Products
INSERT IGNORE INTO products (id, name, sku, category, brand, stock, min, price, supplier, location, barcode, expiry) VALUES
('PRD-001', 'Arduino Uno', 'ARD-UNO-R3', 'Electronics', 'Arduino', 24, 12, 29.90, 'TechSource India', 'Lab A', '890100000001', NULL),
('PRD-002', 'Temperature Sensor', 'SEN-TMP-01', 'Sensors', 'Circuit Hub', 8, 15, 29.80, 'Circuit Hub', 'Lab A', '890100000002', '2027-02-14'),
('PRD-003', 'USB Cable', 'CAB-USB-C-2M', 'Accessories', 'OfficeKart', 0, 20, 8.50, 'OfficeKart', 'Store Room', '890100000003', NULL),
('PRD-004', 'Wireless Mouse', 'MOU-WLS-02', 'Peripherals', 'Logitech', 42, 10, 29.97, 'OfficeKart', 'Store Room', '890100000004', NULL),
('PRD-005', 'Mechanical Keyboard', 'KEY-MECH-87', 'Peripherals', 'Keychron', 6, 8, 89.90, 'TechSource India', 'Store Room', '890100000005', NULL);

-- Seed Movements
INSERT IGNORE INTO movements (id, product, type, qty, date, reason) VALUES
('MOV-104', 'Wireless Mouse', 'Stock out', -12, 'Today, 10:42 AM', 'Department Issue'),
('MOV-103', 'Arduino Uno', 'Stock in', 20, 'Today, 09:18 AM', 'Purchase order'),
('MOV-102', 'Temperature Sensor', 'Adjustment', -4, 'Yesterday, 4:32 PM', 'Cycle count');

-- Seed Settings
INSERT IGNORE INTO settings (`key`, `value`) VALUES
('threshold', '10'),
('expiry', '30'),
('dark', 'false');

-- Seed Default Admin User (Password: password123)
-- bcrypt hash for 'password123'
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('Jordan Davis', 'jordan@acmecampus.edu', '$2b$12$e8Yy878vH3iYV0zM8YwFVuqQp0wDfZQ9K8J/N4R3O5t6U7V8W9XyZ', 'Administrator');
