-- Los aportes a metas salen del balance neto (cuenta principal) y generan un gasto registrado.

INSERT INTO categories (name, icon, color, type)
SELECT 'Ahorro', 'wallet', '#00D4AA', 'expense'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Ahorro');

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

  SELECT id INTO v_category_id FROM categories WHERE name = 'Ahorro' LIMIT 1;
  IF v_category_id IS NULL THEN
    INSERT INTO categories (name, icon, color, type)
    VALUES ('Ahorro', 'wallet', '#00D4AA', 'expense')
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
