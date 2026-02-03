-- Flows table with hierarchical structure
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add flow_id to routes table (keep flow_name for backward compatibility during migration)
ALTER TABLE routes ADD COLUMN flow_id UUID REFERENCES flows(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_flows_product_id ON flows(product_id);
CREATE INDEX idx_flows_parent_flow_id ON flows(parent_flow_id);
CREATE INDEX idx_flows_level ON flows(level);
CREATE INDEX idx_routes_flow_id ON routes(flow_id);

-- Index for efficient tree queries
CREATE INDEX idx_flows_product_parent ON flows(product_id, parent_flow_id);

COMMENT ON TABLE flows IS 'Hierarchical flow organization for screens';
COMMENT ON COLUMN flows.level IS '0 = root flow, 1 = sub-flow, 2 = nested sub-flow, etc.';
COMMENT ON COLUMN flows.order_index IS 'Sort order within the same parent';
