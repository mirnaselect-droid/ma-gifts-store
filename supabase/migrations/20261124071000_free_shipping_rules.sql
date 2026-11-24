-- Free shipping: orders containing only Original/Mirror items, or EGP subtotal strictly above 5,500.
do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.create_customer_order_secure(uuid,text,text,text,text,text,text,text,text,jsonb)'::regprocedure)
    into v_def;
  if position('v_subtotal > 5500' in v_def) = 0 then
    v_def := replace(
      v_def,
      '  if v_free_shipping then',
      '  if v_subtotal > 5500 and coalesce(v_currency, ''EGP'') = ''EGP'' then v_free_shipping := true; end if;' || E'\n' || '  if v_free_shipping then'
    );
    execute v_def;
  end if;
end $$;
