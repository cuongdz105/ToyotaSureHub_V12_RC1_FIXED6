-- ==========================================================
-- ĐĂNG LÊN TƯỜNG CÁ NHÂN (PROFILE WALL) — 05/11/2026
-- ==========================================================
-- Chạy 1 lần trong Supabase → SQL Editor TRƯỚC KHI deploy code mới.
-- Chạy lại nhiều lần cũng không sao (dùng IF NOT EXISTS).
-- ==========================================================

-- 1. Loại đích đăng của Job: 'group' (nhóm) hoặc 'profile' (tường cá nhân)
alter table public.facebook_queue
  add column if not exists target_type text not null default 'group';

alter table public.facebook_queue
  drop constraint if exists facebook_queue_target_type_check;

alter table public.facebook_queue
  add constraint facebook_queue_target_type_check
  check (target_type in ('group', 'profile', 'page'));

-- Job tường cá nhân không có nhóm → cho phép group_id trống
alter table public.facebook_queue
  alter column group_id drop not null;

-- Tiện ích Chrome hỏi job theo (target_type, account_id, status) mỗi vài phút
create index if not exists facebook_queue_profile_pick_idx
  on public.facebook_queue (target_type, account_id, status, created_at);

-- 2. Báo cáo: tách bài đăng tường khỏi bài đăng nhóm
alter table public.posting_reports
  add column if not exists target_type text not null default 'group';

alter table public.posting_reports
  alter column group_id drop not null;
