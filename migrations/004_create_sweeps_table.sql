-- Sweeps table to track background sweep jobs
CREATE TABLE IF NOT EXISTS sweeps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  current_step TEXT,
  progress_message TEXT,
  error_message TEXT,
  pages_crawled INTEGER DEFAULT 0,
  tasks_discovered INTEGER DEFAULT 0,
  flows_categorized INTEGER DEFAULT 0,
  changes_detected INTEGER DEFAULT 0,
  components_extracted INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sweeps_product_id ON sweeps(product_id);
CREATE INDEX idx_sweeps_status ON sweeps(status);
CREATE INDEX idx_sweeps_started_at ON sweeps(started_at DESC);
