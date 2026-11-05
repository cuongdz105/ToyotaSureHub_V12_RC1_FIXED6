-- ==========================================================
-- ĐĂNG LÊN FANPAGE — 05/11/2026
-- Cho phép job loại 'page' trong FB Queue.
-- Chạy trong Supabase → SQL Editor. Chạy lại nhiều lần không sao.
-- ==========================================================

alter table public.facebook_queue
  drop constraint if exists facebook_queue_target_type_check;

alter table public.facebook_queue
  add constraint facebook_queue_target_type_check
  check (target_type in ('group', 'profile', 'page'));
