-- Create components table
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create component_instances table
CREATE TABLE IF NOT EXISTS component_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bounding_box JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_product_id ON components(product_id);
CREATE INDEX IF NOT EXISTS idx_component_instances_component_id ON component_instances(component_id);
CREATE INDEX IF NOT EXISTS idx_component_instances_route_id ON component_instances(route_id);

-- Add instance_count view helper (optional)
CREATE OR REPLACE VIEW component_stats AS
SELECT
  c.id,
  c.name,
  c.image_url,
  c.product_id,
  COUNT(DISTINCT ci.id) as instance_count,
  COUNT(DISTINCT ci.route_id) as screen_count
FROM components c
LEFT JOIN component_instances ci ON c.id = ci.component_id
GROUP BY c.id, c.name, c.image_url, c.product_id;
