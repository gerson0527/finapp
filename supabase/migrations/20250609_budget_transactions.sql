-- Vincula gastos a presupuestos concretos (gym, Netflix, etc.)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_budget ON transactions(budget_id);

DROP VIEW IF EXISTS budgets_with_spent;

CREATE VIEW budgets_with_spent AS
SELECT
  b.id,
  b.title,
  b.category_id,
  b.month,
  b.limit_amount,
  b.user_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  COALESCE((
    SELECT SUM(t.amount)
    FROM transactions t
    WHERE t.user_id = b.user_id
      AND t.type = 'expense'
      AND TO_CHAR(t.date, 'YYYY-MM') = b.month
      AND (
        t.budget_id = b.id
        OR (
          t.budget_id IS NULL
          AND t.category_id = b.category_id
          AND LOWER(TRIM(t.description)) = LOWER(TRIM(b.title))
        )
      )
  ), 0) AS spent,
  CASE
    WHEN b.limit_amount > 0
    THEN ROUND((
      COALESCE((
        SELECT SUM(t.amount)
        FROM transactions t
        WHERE t.user_id = b.user_id
          AND t.type = 'expense'
          AND TO_CHAR(t.date, 'YYYY-MM') = b.month
          AND (
            t.budget_id = b.id
            OR (
              t.budget_id IS NULL
              AND t.category_id = b.category_id
              AND LOWER(TRIM(t.description)) = LOWER(TRIM(b.title))
            )
          )
      ), 0) / b.limit_amount
    ) * 100, 1)
    ELSE 0
  END AS percentage
FROM budgets b
LEFT JOIN categories c ON c.id = b.category_id;
