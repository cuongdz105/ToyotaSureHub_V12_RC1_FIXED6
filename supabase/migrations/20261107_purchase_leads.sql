-- ==========================================================
-- THU MUA XE (nguồn xe dân bán) — 07/11/2026
-- ==========================================================
-- Chạy 1 lần trong Supabase → SQL Editor TRƯỚC KHI deploy code mới.
-- Chạy lại nhiều lần cũng không sao (dùng IF NOT EXISTS).
-- ==========================================================

create table if not exists public.purchase_leads (
  id uuid primary key default gen_random_uuid(),

  -- Nguồn tin
  source_type text not null default 'facebook',      -- facebook | website | other
  source_name text,                                   -- tên nhóm FB / bonbanh.com / oto.com.vn ...
  source_url text,                                    -- link bài / link tin rao

  -- Người bán
  seller_name text,
  phone text,                                         -- số như hiển thị
  phone_normalized text,                              -- dạng 0xxxxxxxxx để dò trùng
  seller_type text not null default 'unknown',        -- individual | dealer | unknown

  -- Thông tin xe
  brand text,
  model text,
  version text,
  year int,
  odo_km int,
  color text,
  gearbox text,
  fuel text,
  location text,
  asking_price bigint,                                -- giá rao (VNĐ)
  description text,                                   -- tóm tắt tình trạng xe

  -- Dữ liệu gốc
  raw_text text,
  screenshot_url text,
  screenshot_path text,
  ai_confidence numeric,

  -- Chăm sóc / đàm phán
  status text not null default 'new',
  offered_price bigint,                               -- giá mình trả
  deal_price bigint,                                  -- giá chốt
  next_follow_up_at timestamptz,
  notes text,
  contact_log jsonb not null default '[]'::jsonb,     -- [{at, status, note}]

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchase_leads
  drop constraint if exists purchase_leads_status_check;
alter table public.purchase_leads
  add constraint purchase_leads_status_check
  check (status in ('new', 'called', 'negotiating', 'inspected', 'bought', 'dropped'));

alter table public.purchase_leads
  drop constraint if exists purchase_leads_seller_type_check;
alter table public.purchase_leads
  add constraint purchase_leads_seller_type_check
  check (seller_type in ('individual', 'dealer', 'unknown'));

create index if not exists purchase_leads_phone_idx
  on public.purchase_leads (phone_normalized);
create index if not exists purchase_leads_status_idx
  on public.purchase_leads (status, created_at desc);
create index if not exists purchase_leads_source_url_idx
  on public.purchase_leads (source_url);

-- Tự cập nhật updated_at
create or replace function public.purchase_leads_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists purchase_leads_touch on public.purchase_leads;
create trigger purchase_leads_touch
  before update on public.purchase_leads
  for each row execute function public.purchase_leads_touch();

-- Chỉ người đã đăng nhập mới đọc/ghi được (số điện thoại là dữ liệu cá nhân)
alter table public.purchase_leads enable row level security;

drop policy if exists purchase_leads_auth_all on public.purchase_leads;
create policy purchase_leads_auth_all on public.purchase_leads
  for all to authenticated using (true) with check (true);

-- ==========================================================
-- Bucket lưu ảnh chụp màn hình bài đăng (riêng tư)
-- ==========================================================
insert into storage.buckets (id, name, public)
values ('purchase-lead-images', 'purchase-lead-images', false)
on conflict (id) do nothing;

drop policy if exists purchase_lead_images_auth on storage.objects;
create policy purchase_lead_images_auth on storage.objects
  for all to authenticated
  using (bucket_id = 'purchase-lead-images')
  with check (bucket_id = 'purchase-lead-images');
