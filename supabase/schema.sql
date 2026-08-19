-- HydraLove Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    weight_kg NUMERIC NOT NULL,
    daily_goal_ml INTEGER NOT NULL,
    role_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hydration Entries Table
CREATE TABLE IF NOT EXISTS hydration_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    local_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user date range queries
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON hydration_entries (user_id, local_date);

-- 3. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notification History Table
CREATE TABLE IF NOT EXISTS notification_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for simple personal use setup
CREATE POLICY "Allow public select users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update users" ON users FOR ALL USING (true);

CREATE POLICY "Allow public select entries" ON hydration_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update entries" ON hydration_entries FOR ALL USING (true);

CREATE POLICY "Allow public select push_subscriptions" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update push_subscriptions" ON push_subscriptions FOR ALL USING (true);

CREATE POLICY "Allow public select notification_history" ON notification_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update notification_history" ON notification_history FOR ALL USING (true);
