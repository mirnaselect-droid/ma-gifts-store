-- Made-to-order products: inventory is optional and never shown to customers.
alter table public.products
  add column if not exists track_inventory boolean not null default false;

create or replace function public.create_customer_order_secure(
  p_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_country text,
  p_city text,
  p_shipping_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_currency text := null;
  v_product record;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_quality text;
  v_quality_option jsonb;
  v_unit_price numeric;
  v_line_total numeric;
  v_shipping_fee numeric := 0;
  v_shipping_config jsonb;
  v_governorate text;
begin
  if p_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(length(trim(p_customer_name)),0) < 2 or length(p_customer_name) > 160 then raise exception 'INVALID_CUSTOMER_NAME'; end if;
  if coalesce(length(trim(p_customer_phone)),0) < 6 or length(p_customer_phone) > 40 then raise exception 'INVALID_PHONE'; end if;
  if coalesce(length(trim(p_country)),0) < 2 or length(p_country) > 100 then raise exception 'INVALID_COUNTRY'; end if;
  if coalesce(length(trim(p_city)),0) < 2 or length(p_city) > 120 then raise exception 'INVALID_CITY'; end if;
  if coalesce(length(trim(p_shipping_address)),0) < 5 or length(p_shipping_address) > 1000 then raise exception 'INVALID_ADDRESS'; end if;
  if p_payment_method not in ('wallets','instapay','bank_cards','bank_transfer') then raise exception 'INVALID_PAYMENT_METHOD'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then raise exception 'INVALID_CART'; end if;

  select value into v_shipping_config
  from public.store_settings
  where key = 'shipping';

  v_governorate := btrim(split_part(p_city, ' - ', 1));
  if coalesce((v_shipping_config->>'configured')::boolean, false) is not true then
    raise exception 'SHIPPING_NOT_CONFIGURED';
  end if;
  v_shipping_fee := nullif(v_shipping_config->'fees'->>v_governorate, '')::numeric;
  if v_shipping_fee is null or v_shipping_fee < 65 or v_shipping_fee > 200 then
    raise exception 'INVALID_SHIPPING_GOVERNORATE';
  end if;

  insert into public.orders (
    user_id, status, customer_name, customer_email, customer_phone,
    country_code, city, shipping_address, notes, subtotal, shipping_fee,
    total, currency, payment_method, payment_status
  ) values (
    p_user_id, 'pending', trim(p_customer_name), nullif(trim(p_customer_email), ''),
    trim(p_customer_phone), trim(p_country), trim(p_city), trim(p_shipping_address),
    nullif(left(coalesce(p_notes,''),1000),''), 0, v_shipping_fee, v_shipping_fee, 'EGP',
    p_payment_method, 'unpaid'
  ) returning id, order_number into v_order_id, v_order_number;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := coalesce(v_item->>'product_id', v_item->>'id')::uuid;
      v_quantity := coalesce(v_item->>'quantity', v_item->>'qty')::integer;
      v_quality := nullif(trim(coalesce(v_item->>'quality','')), '');
    exception when others then
      raise exception 'INVALID_CART_ITEM';
    end;
    if v_product_id is null then raise exception 'INVALID_CART_ITEM'; end if;
    if v_quantity is null or v_quantity < 1 or v_quantity > 20 then raise exception 'INVALID_QUANTITY'; end if;

    select id, name_ar, price, currency, stock_quantity, images, track_inventory, translations
      into v_product
      from public.products
      where id = v_product_id and is_active = true
      for update;

    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    if coalesce(v_product.track_inventory, false) and v_product.stock_quantity < v_quantity then
      raise exception 'OUT_OF_STOCK:%', v_product.name_ar;
    end if;
    if v_currency is null then
      v_currency := v_product.currency;
    elsif v_currency <> v_product.currency then
      raise exception 'MIXED_CURRENCIES_NOT_SUPPORTED';
    end if;

    v_unit_price := v_product.price;
    if v_quality is not null then
      v_quality_option := coalesce(v_product.translations->'quality_options'->v_quality, '{}'::jsonb);
      if coalesce((v_quality_option->>'enabled')::boolean, false) is not true
        or coalesce((v_quality_option->>'min')::numeric, 0) <= 0
        or coalesce((v_quality_option->>'max')::numeric, 0) < coalesce((v_quality_option->>'min')::numeric, 0) then
        raise exception 'INVALID_PRODUCT_QUALITY';
      end if;
      v_unit_price := (v_quality_option->>'min')::numeric;
    end if;
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    if coalesce(v_product.track_inventory, false) then
      update public.products
        set stock_quantity = stock_quantity - v_quantity, updated_at = now()
        where id = v_product.id;
    end if;

    insert into public.order_items (
      order_id, product_id, product_name, product_image, unit_price, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.name_ar || case when v_quality is null then '' else ' · ' || v_quality end, v_product.images[1],
      v_unit_price, v_quantity, v_line_total
    );
  end loop;

  update public.orders
    set subtotal = v_subtotal, shipping_fee = v_shipping_fee,
        total = v_subtotal + v_shipping_fee,
        currency = coalesce(v_currency,'EGP'), updated_at = now()
    where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_subtotal + v_shipping_fee,
    'currency', coalesce(v_currency,'EGP'),
    'status', 'pending',
    'payment_status', 'unpaid'
  );
end;
$$;

revoke all on function public.create_customer_order_secure(uuid,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_customer_order_secure(uuid,text,text,text,text,text,text,text,text,jsonb) to service_role;
