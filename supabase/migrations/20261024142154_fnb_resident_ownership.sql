-- FNB WaterWatch resident ownership; applied to the live Limise Watch project on 2026-10-24.
-- Preserves existing synthetic reports. New reports receive verified Supabase Auth owner IDs.
ALTER TABLE public.fnb_reports
  ADD COLUMN IF NOT EXISTS resident_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fnb_reports_resident_user_id
  ON public.fnb_reports (resident_user_id);

-- This table remains RLS-protected and not directly writable from browser clients.
-- The Edge Function checks email confirmation and enforces report ownership.
