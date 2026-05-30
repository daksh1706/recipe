import { supabase } from './config/supabase.js';

const sqlDDL = `
-- 1. Create message channel and delivery status enum types
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms');
CREATE TYPE notification_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'read', 'failed');

-- 2. Create the notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    channel notification_channel NOT NULL,
    template_name TEXT NOT NULL,
    status notification_status DEFAULT 'pending',
    pdf_url TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    provider_message_id TEXT UNIQUE, -- Stores Twilio Message SID
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create database indexes for lookups
CREATE INDEX idx_notification_logs_order ON notification_logs(order_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_provider ON notification_logs(provider_message_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Permit complete access to service role
CREATE POLICY "Allow service role complete access" ON notification_logs
    FOR ALL USING (true) WITH CHECK (true);
`;

async function verifyOrSetupLogsTable() {
  console.log("Checking if 'notification_logs' table is accessible in Supabase...");
  
  try {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('id')
      .limit(1);

    if (error && error.message.includes("does not exist")) {
      console.log("\n⚠️ Table 'notification_logs' does not exist in Supabase yet.");
      console.log("--------------------------------------------------------------------------------");
      console.log("👉 ACTION REQUIRED: Since direct ALTER/CREATE TABLE queries are restricted by");
      console.log("Supabase REST clients under Row-Level Security, please copy and run the following");
      console.log("SQL script in your Supabase SQL Editor dashboard:");
      console.log("--------------------------------------------------------------------------------");
      console.log(sqlDDL);
      console.log("--------------------------------------------------------------------------------");
      console.log("Supabase SQL Editor URL: https://supabase.com/dashboard/project/crtitxemhkckpvfsrtdc/sql");
      console.log("--------------------------------------------------------------------------------");
    } else if (error) {
      console.error("❌ Unexpected database error:", error.message);
    } else {
      console.log("✅ Success! 'notification_logs' table exists and is fully accessible.");
    }
  } catch (err) {
    console.error("❌ Network or connection error during check:", err.message);
  }
}

verifyOrSetupLogsTable();
