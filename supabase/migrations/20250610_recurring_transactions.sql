-- Transacciones recurrentes mensuales
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_day INTEGER,
  ADD COLUMN IF NOT EXISTS recurring_source_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring
  ON transactions(user_id, is_recurring)
  WHERE is_recurring = TRUE;

CREATE OR REPLACE FUNCTION generate_recurring_transactions(p_month TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_created INTEGER := 0;
  v_year INTEGER;
  v_mon INTEGER;
  v_day INTEGER;
  v_last_day INTEGER;
  v_tx_date DATE;
  tpl RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión';
  END IF;

  v_year := split_part(p_month, '-', 1)::INTEGER;
  v_mon := split_part(p_month, '-', 2)::INTEGER;
  v_last_day := EXTRACT(DAY FROM (DATE_TRUNC('month', make_date(v_year, v_mon, 1)) + INTERVAL '1 month - 1 day'))::INTEGER;

  FOR tpl IN
    SELECT *
    FROM transactions
    WHERE user_id = v_user_id
      AND is_recurring = TRUE
      AND recurring_source_id IS NULL
  LOOP
    v_day := LEAST(COALESCE(tpl.recurrence_day, 1), v_last_day);
    v_tx_date := make_date(v_year, v_mon, v_day);

    IF EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = v_user_id
        AND recurring_source_id = tpl.id
        AND TO_CHAR(date, 'YYYY-MM') = p_month
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO transactions (
      user_id, type, amount, description, category_id, account_id,
      date, time, note, is_recurring, recurrence_day, recurring_source_id
    ) VALUES (
      v_user_id, tpl.type, tpl.amount, tpl.description, tpl.category_id, tpl.account_id,
      v_tx_date, tpl.time, tpl.note, FALSE, tpl.recurrence_day, tpl.id
    );

    IF tpl.type = 'expense' THEN
      UPDATE accounts SET balance = balance - tpl.amount WHERE id = tpl.account_id;
    ELSIF tpl.type = 'income' THEN
      UPDATE accounts SET balance = balance + tpl.amount WHERE id = tpl.account_id;
    END IF;

    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END;
$$;
