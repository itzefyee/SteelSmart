-- Create reports table for admin report generation
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('MONTHLY_MOST_QUOTED', 'PRODUCT_ANALYTICS', 'USER_ACTIVITY', 'CUSTOM')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  parameters JSONB,
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can view reports (admin only in production)
CREATE POLICY "Authenticated users can view reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can update reports
CREATE POLICY "Authenticated users can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only authenticated users can delete reports
CREATE POLICY "Authenticated users can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

-- Create storage bucket for admin reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-reports', 'admin-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Authenticated users can read reports
CREATE POLICY "Authenticated users can read reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'admin-reports');

-- Storage policy: Authenticated users can upload reports
CREATE POLICY "Authenticated users can upload reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'admin-reports');

-- Storage policy: Authenticated users can delete reports
CREATE POLICY "Authenticated users can delete reports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'admin-reports');
