-- Ajuste atómico de saldos.
--
-- Antes el cliente calculaba el saldo nuevo (saldo que tenía en memoria + cambio) y lo
-- escribía completo con un upsert. Con dos pestañas o dispositivos abiertos, o dos
-- operaciones seguidas, una escritura pisaba a la otra y el saldo quedaba mal sin aviso.
--
-- Esta función suma el cambio sobre el valor que ya está en la base, en una sola sentencia,
-- y devuelve la fila resultante para que el cliente se sincronice con ella.
-- Corre como el usuario que la llama (security invoker), así que respeta las políticas RLS
-- existentes de la tabla wallets.

create or replace function public.apply_balance_delta(
  p_wallet numeric default 0,
  p_investment numeric default 0,
  p_credit numeric default 0
)
returns setof public.wallets
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No hay una sesión activa' using errcode = '28000';
  end if;

  return query
    insert into public.wallets as w (user_id, wallet_balance, investment_balance, credit_balance, credit_limit, updated_at)
    values (auth.uid(), p_wallet, p_investment, p_credit, 0, now())
    on conflict (user_id) do update set
      wallet_balance = w.wallet_balance + excluded.wallet_balance,
      investment_balance = w.investment_balance + excluded.investment_balance,
      credit_balance = w.credit_balance + excluded.credit_balance,
      updated_at = now()
    returning w.*;
end;
$$;

revoke all on function public.apply_balance_delta(numeric, numeric, numeric) from public, anon;
grant execute on function public.apply_balance_delta(numeric, numeric, numeric) to authenticated;
