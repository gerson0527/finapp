-- Asegura que update_account_balance actualice cuentas del usuario autenticado
CREATE OR REPLACE FUNCTION update_account_balance(
  account_id UUID,
  delta DECIMAL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión';
  END IF;

  UPDATE accounts
  SET balance = balance + delta
  WHERE id = account_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo actualizar la cuenta';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION update_account_balance(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION update_account_balance(UUID, DECIMAL) TO service_role;
