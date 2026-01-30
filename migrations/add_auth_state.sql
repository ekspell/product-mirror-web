-- Add auth_state column to products table
-- This allows tracking whether a product requires authentication or is public

ALTER TABLE products
ADD COLUMN auth_state TEXT DEFAULT 'public'
CHECK (auth_state IN ('authenticated', 'public'));

-- Update existing Calendly product to be authenticated
UPDATE products
SET auth_state = 'authenticated'
WHERE name = 'Calendly';

-- Example: To add a second Calendly product for public mode:
-- INSERT INTO products (team_id, name, staging_url, auth_state)
-- VALUES (
--   (SELECT team_id FROM products WHERE name = 'Calendly' LIMIT 1),
--   'Calendly',
--   'https://calendly.com',
--   'public'
-- );
