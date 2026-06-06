-- Categorías por usuario: defaults globales (user_id NULL) + personalizadas (user_id = auth.uid())

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Nombres de categorías del sistema (visibles para todos)
DO $$
DECLARE
  seed_names TEXT[] := ARRAY[
    'Alimentación', 'Transporte', 'Entretenimiento', 'Supermercado',
    'Suscripciones', 'Compras', 'Nómina', 'Banco', 'Freelance', 'Ahorro'
  ];
  r RECORD;
  new_cat_id UUID;
BEGIN
  -- Clonar categorías personalizadas (sin user_id) para cada usuario que las usa
  FOR r IN
    SELECT DISTINCT c.id AS old_id, x.user_id
    FROM categories c
    INNER JOIN (
      SELECT category_id, user_id FROM transactions WHERE category_id IS NOT NULL
      UNION
      SELECT category_id, user_id FROM budgets WHERE category_id IS NOT NULL
    ) x ON x.category_id = c.id
    WHERE c.user_id IS NULL
      AND NOT (c.name = ANY(seed_names))
  LOOP
    SELECT id INTO new_cat_id
    FROM categories
    WHERE user_id = r.user_id
      AND name = (SELECT name FROM categories WHERE id = r.old_id)
    LIMIT 1;

    IF new_cat_id IS NULL THEN
      INSERT INTO categories (name, icon, color, type, user_id)
      SELECT name, icon, color, type, r.user_id
      FROM categories
      WHERE id = r.old_id
      RETURNING id INTO new_cat_id;
    END IF;

    UPDATE transactions
    SET category_id = new_cat_id
    WHERE category_id = r.old_id AND user_id = r.user_id;

    UPDATE budgets
    SET category_id = new_cat_id
    WHERE category_id = r.old_id AND user_id = r.user_id;
  END LOOP;

  -- Eliminar categorías personalizadas huérfanas (sin dueño)
  DELETE FROM categories
  WHERE user_id IS NULL
    AND NOT (name = ANY(seed_names));
END $$;

-- RLS: solo defaults del sistema + categorías propias
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select" ON categories
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "categories_insert" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_update" ON categories
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_delete" ON categories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Ahorro del sistema (usado en aportes a metas)
CREATE OR REPLACE FUNCTION add_savings_contribution(
  goal_id UUID,
  contribution_amount DECIMAL
) RETURNS SETOF savings_goals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_goal_title TEXT;
  v_goal_user UUID;
  v_account_id UUID;
  v_balance DECIMAL;
  v_category_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para aportar';
  END IF;

  IF contribution_amount IS NULL OR contribution_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0';
  END IF;

  SELECT title, user_id INTO v_goal_title, v_goal_user
  FROM savings_goals
  WHERE id = goal_id;

  IF v_goal_user IS NULL OR v_goal_user <> v_user_id THEN
    RAISE EXCEPTION 'Meta de ahorro no encontrada';
  END IF;

  SELECT id, balance INTO v_account_id, v_balance
  FROM accounts
  WHERE user_id = v_user_id
  ORDER BY created_at
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No tienes cuenta principal configurada';
  END IF;

  IF v_balance < contribution_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente en tu balance neto';
  END IF;

  SELECT id INTO v_category_id
  FROM categories
  WHERE name = 'Ahorro' AND user_id IS NULL
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO categories (name, icon, color, type, user_id)
    VALUES ('Ahorro', 'wallet', '#00D4AA', 'expense', NULL)
    RETURNING id INTO v_category_id;
  END IF;

  UPDATE savings_goals
  SET saved_amount = saved_amount + contribution_amount
  WHERE id = goal_id AND user_id = v_user_id;

  UPDATE accounts
  SET balance = balance - contribution_amount
  WHERE id = v_account_id;

  INSERT INTO transactions (
    user_id, type, amount, description, category_id, account_id, date, time, note
  ) VALUES (
    v_user_id,
    'expense',
    contribution_amount,
    'Aporte: ' || v_goal_title,
    v_category_id,
    v_account_id,
    CURRENT_DATE,
    CURRENT_TIME,
    'Meta de ahorro'
  );

  RETURN QUERY
  SELECT * FROM savings_goals WHERE id = goal_id;
END;
$$;
