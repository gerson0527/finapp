-- ============================================================
-- ESQUEMA SUPABASE — Finanzas Personales
-- Ejecutar en el editor SQL de Supabase
-- ============================================================

-- 1. TABLA DE CATEGORÍAS
-- user_id NULL = categorías del sistema (visibles para todos)
-- user_id = auth.uid() = categorías personalizadas del usuario
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income', 'both')) DEFAULT 'both',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- 2. TABLA DE PERFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  monthly_income DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CUENTAS
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('checking', 'savings', 'cash', 'credit')) DEFAULT 'checking',
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'COP',
  color TEXT DEFAULT '#AAFF00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE TRANSACCIONES
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES accounts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);

-- 5. TABLA DE PRESUPUESTOS
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  month TEXT NOT NULL,
  limit_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, title)
);

-- 6. VISTA: presupuestos con gasto calculado
CREATE OR REPLACE VIEW budgets_with_spent AS
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

-- 7. TABLA DE METAS DE AHORRO
CREATE TABLE savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT NOT NULL,
  color TEXT DEFAULT '#4A9EFF',
  target_amount DECIMAL(15,2) NOT NULL,
  saved_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FUNCIÓN: actualizar balance de cuenta
CREATE OR REPLACE FUNCTION update_account_balance(
  account_id UUID,
  delta DECIMAL
) RETURNS void AS $$
BEGIN
  UPDATE accounts
  SET balance = balance + delta
  WHERE id = account_id;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCIÓN: aporte a meta (descuenta balance neto + registra gasto)
-- Ver supabase/migrations/20250608_savings_from_balance.sql

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categorías del sistema (user_id NULL, visibles para todos)
INSERT INTO categories (name, icon, color, type) VALUES
('Alimentación', 'restaurant', '#AAFF00', 'expense'),
('Transporte', 'car', '#FFA500', 'expense'),
('Entretenimiento', 'film', '#FF6B6B', 'expense'),
('Supermercado', 'cart', '#AAFF00', 'expense'),
('Suscripciones', 'play-circle', '#4A9EFF', 'expense'),
('Compras', 'bag', '#FF6B6B', 'expense'),
('Nómina', 'cash', '#AAFF00', 'income'),
('Banco', 'business', '#4A9EFF', 'income'),
('Freelance', 'laptop', '#AAFF00', 'income');

-- Sin cuenta ni metas demo: cada usuario las crea en el onboarding
