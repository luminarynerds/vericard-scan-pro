-- Migration: Add subscription and monetization tables
-- Version: 003
-- Date: 2024-01-01
-- Description: Adds tables for Stripe subscriptions, payments, commissions, and usage tracking

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'enterprise')),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  scans_used INTEGER DEFAULT 0,
  scans_limit INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  type TEXT NOT NULL CHECK (type IN ('subscription', 'commission', 'refund', 'chargeback')),
  stripe_payment_intent_id TEXT,
  stripe_payment_method_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_type ON payments(type);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  platform_fee_percent DECIMAL(5,2) NOT NULL,
  platform_fee_amount INTEGER NOT NULL, -- In cents
  seller_amount INTEGER NOT NULL, -- In cents
  stripe_transfer_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_commissions_transaction ON commissions(transaction_id);
CREATE INDEX idx_commissions_seller ON commissions(seller_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- Usage records table
CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  scans_count INTEGER DEFAULT 0,
  overage INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Unique constraint to ensure one record per subscription period
CREATE UNIQUE INDEX idx_usage_subscription_period ON usage_records(subscription_id, period_start, period_end);
CREATE INDEX idx_usage_user_id ON usage_records(user_id);

-- Usage alerts table
CREATE TABLE IF NOT EXISTS usage_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('approaching_limit', 'limit_reached', 'overage_warning')),
  threshold INTEGER NOT NULL, -- Percentage
  triggered BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_alerts_subscription ON usage_alerts(subscription_id);
CREATE INDEX idx_alerts_type ON usage_alerts(type);

-- PCI compliance logs table
CREATE TABLE IF NOT EXISTS pci_compliance_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('payment_method_added', 'payment_method_removed', 'payment_attempted', 'subscription_modified', 'security_challenge')),
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  tokenized_data TEXT, -- Never store raw card data
  success BOOLEAN NOT NULL,
  error_code TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for compliance auditing
CREATE INDEX idx_pci_logs_user ON pci_compliance_logs(user_id);
CREATE INDEX idx_pci_logs_action ON pci_compliance_logs(action);
CREATE INDEX idx_pci_logs_timestamp ON pci_compliance_logs(timestamp);

-- Revenue metrics table for analytics
CREATE TABLE IF NOT EXISTS revenue_metrics (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_revenue INTEGER DEFAULT 0,
  subscription_revenue INTEGER DEFAULT 0,
  commission_revenue INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  churned_subscriptions INTEGER DEFAULT 0,
  average_revenue_per_user INTEGER DEFAULT 0,
  monthly_recurring_revenue INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_revenue_period ON revenue_metrics(period, start_date, end_date);

-- Webhook events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_type ON stripe_webhook_events(type);
CREATE INDEX idx_webhook_events_processed ON stripe_webhook_events(processed);

-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'pro', 'enterprise'));

-- Add commission link to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS commission_id TEXT REFERENCES commissions(id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate MRR
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS INTEGER AS $$
DECLARE
    mrr INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN s.tier = 'basic' THEN 4900
            WHEN s.tier = 'pro' THEN 14900
            ELSE 0
        END
    ), 0) INTO mrr
    FROM subscriptions s
    WHERE s.status = 'active'
    AND s.cancel_at_period_end = FALSE;
    
    RETURN mrr;
END;
$$ LANGUAGE plpgsql;

-- Create view for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_subscriptions,
    COUNT(CASE WHEN tier = 'basic' THEN 1 END) as basic_tier_count,
    COUNT(CASE WHEN tier = 'pro' THEN 1 END) as pro_tier_count,
    COUNT(CASE WHEN tier = 'enterprise' THEN 1 END) as enterprise_tier_count,
    calculate_mrr() / 100.0 as mrr_dollars
FROM subscriptions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Create view for commission analytics
CREATE OR REPLACE VIEW commission_analytics AS
SELECT
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) as total_commissions,
    SUM(platform_fee_amount) / 100.0 as total_platform_fees_dollars,
    SUM(seller_amount) / 100.0 as total_seller_payouts_dollars,
    AVG(platform_fee_amount) / 100.0 as avg_platform_fee_dollars,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM commissions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'Stores customer subscription information synced with Stripe';
COMMENT ON TABLE payments IS 'Records all payment transactions including subscriptions and commissions';
COMMENT ON TABLE commissions IS 'Tracks platform commissions on card sales with automatic seller payouts';
COMMENT ON TABLE usage_records IS 'Monitors scan usage per subscription billing period';
COMMENT ON TABLE pci_compliance_logs IS 'Audit trail for PCI DSS compliance - never stores raw card data';
COMMENT ON TABLE revenue_metrics IS 'Pre-calculated revenue analytics for dashboard performance';