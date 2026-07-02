-- Questline Realtime Enabler
-- Run this in your Supabase SQL Editor to allow the database to broadcast live changes!

-- 1. Create the publication if it doesn't already exist (Supabase creates this by default, but just in case)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

-- 2. Add the tables we want to broadcast to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;

-- 3. (Optional but recommended) Set replica identity to full so we get the old and new data in the payload
ALTER TABLE public.user_stats REPLICA IDENTITY FULL;
ALTER TABLE public.competitions REPLICA IDENTITY FULL;
