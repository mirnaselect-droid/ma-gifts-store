-- Product names are optional per language; the owner may provide either one.
alter table public.products
  alter column name_ar drop not null,
  alter column name_en drop not null;

-- Keep a useful slug even when only one language is supplied.
update public.products
set slug = coalesce(nullif(slug, ''), nullif(name_en, ''), nullif(name_ar, ''), 'product-' || left(id::text, 8))
where slug is null or slug = '';
