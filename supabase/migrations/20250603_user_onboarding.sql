-- Perfil de usuario y datos aislados por cuenta
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  monthly_income DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Eliminar datos demo compartidos (sin user_id)
DELETE FROM transactions WHERE user_id IS NULL;
DELETE FROM budgets WHERE user_id IS NULL;
DELETE FROM savings_goals WHERE user_id IS NULL;
DELETE FROM accounts WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);

-- Vista de presupuestos filtrada por usuario (DROP necesario al añadir user_id)
DROP VIEW IF EXISTS budgets_with_spent;

CREATE VIEW budgets_with_spent AS
SELECT
  b.id,
  b.category_id,
  b.month,
  b.limit_amount,
  b.user_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  COALESCE(SUM(t.amount), 0) AS spent,
  CASE
    WHEN b.limit_amount > 0
    THEN ROUND((COALESCE(SUM(t.amount), 0) / b.limit_amount) * 100, 1)
    ELSE 0
  END AS percentage
FROM budgets b
LEFT JOIN categories c ON c.id = b.category_id
LEFT JOIN transactions t
  ON t.category_id = b.category_id
  AND t.user_id = b.user_id
  AND t.type = 'expense'
  AND TO_CHAR(t.date, 'YYYY-MM') = b.month
GROUP BY b.id, b.category_id, b.month, b.limit_amount, b.user_id, c.name, c.icon, c.color;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "accounts_own" ON accounts;
DROP POLICY IF EXISTS "savings_own" ON savings_goals;
DROP POLICY IF EXISTS "transactions_own" ON transactions;
DROP POLICY IF EXISTS "budgets_own" ON budgets;

CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "accounts_own" ON accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_own" ON savings_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_own" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_own" ON budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
