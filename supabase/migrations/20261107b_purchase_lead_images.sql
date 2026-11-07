-- ==========================================================
-- THU MUA XE — ẢNH & GIẤY TỜ KHÁCH GỬI — 07/11/2026
-- ==========================================================
-- Chạy SAU file 20261107_purchase_leads.sql.
-- Supabase → SQL Editor → New query → dán → Run. Chạy lại nhiều lần không sao.
-- Ảnh lưu chung bucket riêng tư 'purchase-lead-images' (đã tạo ở file trước).
-- ==========================================================

create table if not exists public.purchase_lead_images (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.purchase_leads(id) on delete cascade,
  category text not null default 'car',      -- car | interior | papers | damage | other
  storage_path text not null,
  file_name text,
  mime_type text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.purchase_lead_images
  drop constraint if exists purchase_lead_images_category_check;
alter table public.purchase_lead_images
  add constraint purchase_lead_images_category_check
  check (category in ('car', 'interior', 'papers', 'damage', 'other'));

create index if not exists purchase_lead_images_lead_idx
  on public.purchase_lead_images (lead_id, created_at);

alter table public.purchase_lead_images enable row level security;

drop policy if exists purchase_lead_images_auth_all on public.purchase_lead_images;
create policy purchase_lead_images_auth_all on public.purchase_lead_images
  for all to authenticated using (true) with check (true);
