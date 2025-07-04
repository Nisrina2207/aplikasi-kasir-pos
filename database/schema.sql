-- database/schema.sql

-- Tabel Pengguna (Kasir)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'kasir' NOT NULL, -- 'admin', 'kasir'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Menu
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    category VARCHAR(50),
    image_url VARCHAR(255), -- Opsional, untuk gambar menu
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pelanggan (Opsional, jika ingin menyimpan data pelanggan)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Meja (Opsional, jika ada sistem meja)
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) UNIQUE NOT NULL,
    capacity INTEGER,
    status VARCHAR(20) DEFAULT 'available' -- 'available', 'occupied', 'reserved'
);

-- Tabel Pesanan
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL, -- Bisa juga customer_id FK ke customers
    table_number VARCHAR(10), -- Bisa juga table_id FK ke tables
    user_id INTEGER NOT NULL, -- FK ke user (kasir yang membuat pesanan)
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'paid', 'cancelled'
    status VARCHAR(20) DEFAULT 'new' NOT NULL, -- 'new', 'preparing', 'completed', 'cancelled'
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabel Detail Pesanan (Item dalam Pesanan)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_order DECIMAL(10, 2) NOT NULL, -- Harga menu saat pesanan dibuat
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(id)
);

-- Tambahkan trigger untuk updated_at pada tabel menus (PostgreSQL)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menus_timestamp
BEFORE UPDATE ON menus
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Insert data awal (contoh user admin)
-- Catatan: Password "admin123" akan di-hash saat aplikasi dijalankan pertama kali atau dari register
INSERT INTO users (username, password_hash, role) VALUES ('admin', '$2b$10$YourActualHashedPasswordHere', 'admin') ON CONFLICT (username) DO NOTHING;
-- Anda akan mengganti '$2b$10$YourActualHashedPasswordHere' dengan hash asli dari 'admin123'
-- setelah Anda bisa melakukan registrasi user atau dengan fungsi hash manual.