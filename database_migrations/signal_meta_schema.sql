-- Signal Metadata Sidecar Table
-- This table stores additional metadata for signals without modifying the existing signal ingestion pipeline

CREATE TABLE IF NOT EXISTS signal_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id VARCHAR(255) NOT NULL UNIQUE, -- References the existing signal ID
    primary_match BOOLEAN DEFAULT TRUE, -- Always true for existing signals
    secondary_matches TEXT[] DEFAULT '{}', -- Array of matched secondary confirmations
    secondary_count INTEGER DEFAULT 0, -- Count of secondary matches
    confidence_score NUMERIC(4,3) DEFAULT 0.500, -- Confidence score 0.000-0.999
    assigned_milestone VARCHAR(10) DEFAULT 'M4', -- M1, M2, M3, or M4
    milestone_assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score_details JSONB DEFAULT '{}', -- Detailed scoring breakdown for debugging
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_meta_signal_id ON signal_meta(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_meta_milestone ON signal_meta(assigned_milestone);
CREATE INDEX IF NOT EXISTS idx_signal_meta_confidence ON signal_meta(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_signal_meta_created_at ON signal_meta(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_signal_meta_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_signal_meta_updated_at
    BEFORE UPDATE ON signal_meta
    FOR EACH ROW
    EXECUTE FUNCTION update_signal_meta_updated_at();

-- Sample data structure for score_details JSONB field:
-- {
--   "base_score": 0.5,
--   "secondary_scores": {
--     "HTF_trend": 0.20,
--     "EMA_alignment": 0.15,
--     "RSI": 0.12
--   },
--   "weights": {
--     "HTF_trend": 0.20,
--     "EMA_alignment": 0.15,
--     "RSI": 0.12,
--     "MACD": 0.10,
--     "ATR_ok": 0.06,
--     "ADX": 0.05,
--     "Volume": 0.04,
--     "Spread_ok": 0.03,
--     "News_ok": 0.05,
--     "Session_ok": 0.05
--   },
--   "raw_confidence": 0.97,
--   "threshold_met": {
--     "M1": false,
--     "M2": true,
--     "M3": true,
--     "M4": true
--   }
-- }

COMMENT ON TABLE signal_meta IS 'Sidecar table for signal metadata and milestone assignments';
COMMENT ON COLUMN signal_meta.signal_id IS 'References the existing signal ID from the main signals table';
COMMENT ON COLUMN signal_meta.secondary_matches IS 'Array of secondary confirmation names that matched';
COMMENT ON COLUMN signal_meta.confidence_score IS 'Computed confidence score from 0.000 to 0.999';
COMMENT ON COLUMN signal_meta.assigned_milestone IS 'Milestone assignment: M1 (90%), M2 (60%), M3 (40%), M4 (25-30%)';
COMMENT ON COLUMN signal_meta.score_details IS 'JSON object containing detailed scoring breakdown for debugging and QA';
