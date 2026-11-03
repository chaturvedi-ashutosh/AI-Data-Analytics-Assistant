BEGIN;

INSERT INTO regions (id, name) VALUES
  (1, 'North America'),
  (2, 'Europe'),
  (3, 'Asia Pacific'),
  (4, 'Latin America'),
  (5, 'Middle East and Africa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, full_name, email, region_id, signup_date) VALUES
  (1, 'Avery Johnson', 'avery.johnson@example.test', 1, '2023-11-14'),
  (2, 'Mia Chen', 'mia.chen@example.test', 3, '2023-12-02'),
  (3, 'Oliver Martin', 'oliver.martin@example.test', 2, '2024-01-09'),
  (4, 'Sofia Garcia', 'sofia.garcia@example.test', 4, '2024-01-22'),
  (5, 'Noah Williams', 'noah.williams@example.test', 1, '2024-02-11'),
  (6, 'Amara Okafor', 'amara.okafor@example.test', 5, '2024-03-03'),
  (7, 'Lucas Weber', 'lucas.weber@example.test', 2, '2024-03-18'),
  (8, 'Priya Shah', 'priya.shah@example.test', 3, '2024-04-01'),
  (9, 'Mateo Silva', 'mateo.silva@example.test', 4, '2024-05-16'),
  (10, 'Emma Thompson', 'emma.thompson@example.test', 1, '2024-06-08'),
  (11, 'Hana Suzuki', 'hana.suzuki@example.test', 3, '2024-08-19'),
  (12, 'Liam O''Connor', 'liam.oconnor@example.test', 2, '2024-10-05')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, category, unit_price, active) VALUES
  (1, 'Ergonomic Laptop Stand', 'Office', 49.99, TRUE),
  (2, 'Wireless Mouse', 'Accessories', 29.99, TRUE),
  (3, 'Mechanical Keyboard', 'Accessories', 89.99, TRUE),
  (4, '27-inch Monitor', 'Electronics', 279.00, TRUE),
  (5, 'USB-C Dock', 'Electronics', 129.50, TRUE),
  (6, 'Adjustable Desk Lamp', 'Office', 39.99, TRUE),
  (7, 'Notebook Set', 'Stationery', 12.50, TRUE),
  (8, 'Noise-Cancelling Headphones', 'Audio', 149.99, TRUE),
  (9, 'Webcam', 'Electronics', 74.00, TRUE),
  (10, 'Desk Organizer', 'Office', 24.99, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, customer_id, order_date, status) VALUES
  (1001, 1, '2024-01-15', 'completed'),
  (1002, 2, '2024-02-02', 'completed'),
  (1003, 3, '2024-02-18', 'completed'),
  (1004, 4, '2024-03-23', 'shipped'),
  (1005, 5, '2024-04-08', 'cancelled'),
  (1006, 6, '2024-05-12', 'completed'),
  (1007, 7, '2024-06-30', 'refunded'),
  (1008, 8, '2024-08-19', 'completed'),
  (1009, 9, '2024-10-11', 'completed'),
  (1010, 10, '2024-12-05', 'completed'),
  (1011, 11, '2025-01-19', 'completed'),
  (1012, 12, '2025-02-20', 'completed'),
  (1013, 1, '2025-03-29', 'processing'),
  (1014, 3, '2025-04-02', 'completed'),
  (1015, 4, '2025-05-24', 'completed'),
  (1016, 5, '2025-07-07', 'shipped'),
  (1017, 6, '2025-09-16', 'completed'),
  (1018, 7, '2025-11-22', 'cancelled'),
  (1019, 8, '2026-01-09', 'completed'),
  (1020, 9, '2026-04-21', 'completed'),
  (1021, 10, '2025-12-10', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1001, 1, 1, 49.99), (2, 1001, 2, 1, 29.99),
  (3, 1002, 3, 1, 89.99), (4, 1002, 7, 2, 12.50),
  (5, 1003, 4, 1, 279.00), (6, 1003, 2, 1, 29.99),
  (7, 1004, 5, 1, 129.50), (8, 1004, 6, 1, 39.99),
  (9, 1005, 8, 1, 149.99),
  (10, 1006, 7, 3, 12.50), (11, 1006, 10, 1, 24.99),
  (12, 1007, 8, 1, 149.99), (13, 1007, 2, 1, 29.99),
  (14, 1008, 9, 2, 74.00),
  (15, 1009, 4, 1, 279.00), (16, 1009, 5, 1, 129.50),
  (17, 1010, 3, 1, 89.99), (18, 1010, 6, 2, 39.99),
  (19, 1011, 1, 2, 49.99), (20, 1011, 7, 1, 12.50),
  (21, 1012, 8, 1, 149.99), (22, 1012, 9, 1, 74.00),
  (23, 1013, 5, 1, 129.50),
  (24, 1014, 4, 2, 279.00), (25, 1014, 2, 1, 29.99),
  (26, 1015, 6, 1, 39.99), (27, 1015, 10, 2, 24.99),
  (28, 1016, 3, 1, 89.99), (29, 1016, 7, 4, 12.50),
  (30, 1017, 5, 1, 129.50), (31, 1017, 8, 1, 149.99),
  (32, 1018, 1, 1, 49.99),
  (33, 1019, 9, 1, 74.00), (34, 1019, 2, 2, 29.99),
  (35, 1020, 4, 1, 279.00), (36, 1020, 3, 1, 89.99),
  (37, 1021, 6, 1, 39.99), (38, 1021, 7, 2, 12.50)
ON CONFLICT (id) DO NOTHING;

UPDATE orders AS order_record
SET total_amount = COALESCE(
  (SELECT SUM(item.line_total) FROM order_items AS item WHERE item.order_id = order_record.id),
  0
)
WHERE order_record.id BETWEEN 1001 AND 1021;

SELECT setval(pg_get_serial_sequence('regions', 'id'), COALESCE(MAX(id), 1), TRUE) FROM regions;
SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE(MAX(id), 1), TRUE) FROM customers;
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1), TRUE) FROM products;
SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE(MAX(id), 1), TRUE) FROM orders;
SELECT setval(pg_get_serial_sequence('order_items', 'id'), COALESCE(MAX(id), 1), TRUE) FROM order_items;

COMMIT;
