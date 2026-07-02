-- Questline 3.0 Migration Script
-- Run this to update your existing tables without conflicts!

-- 1. Add new columns to user_stats (fails gracefully if they already exist)
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Add new columns to completed_quests
ALTER TABLE public.completed_quests ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Update the handle_new_user function to include display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, display_name)
  VALUES (new.id, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Storage Bucket Setup (Run separately if needed)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quest_photos', 'quest_photos', true) 
ON CONFLICT (id) DO NOTHING;

-- Drop storage policies if they exist so we can recreate them safely
DROP POLICY IF EXISTS "Anyone can view quest photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Anyone can view quest photos" 
ON storage.objects FOR SELECT USING (bucket_id = 'quest_photos');

CREATE POLICY "Authenticated users can upload photos" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'quest_photos' AND auth.role() = 'authenticated');
