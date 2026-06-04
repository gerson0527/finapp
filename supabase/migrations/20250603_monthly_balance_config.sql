-- Configuración obligatoria de balance neto por mes
CREATE TABLE IF NOT EXISTS monthly_balance_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  net_balance DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_balance_user_month ON monthly_balance_config(user_id, month);

ALTER TABLE monthly_balance_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_balance_own" ON monthly_balance_config;

CREATE POLICY "monthly_balance_own" ON monthly_balance_config
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Marcar mes actual para usuarios que ya completaron onboarding
INSERT INTO monthly_balance_config (user_id, month, net_balance)
SELECT a.user_id, TO_CHAR(NOW(), 'YYYY-MM'), a.balance
FROM accounts a
WHERE a.user_id IS NOT NULL
ON CONFLICT (user_id, month) DO NOTHING;
