-- Create the signals table
CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    entry_price DECIMAL(15, 5) NOT NULL,
    stop_loss DECIMAL(15, 5) NOT NULL,
    take_profit DECIMAL(15, 5) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the symbol column for faster lookups
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
