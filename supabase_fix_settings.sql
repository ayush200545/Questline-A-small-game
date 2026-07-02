-- Fix 1: Ensure users can update their own stats!
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
CREATE POLICY "Users can update their own stats" 
ON public.user_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix 2: Backfill missing player tags for older accounts
UPDATE public.user_stats 
SET player_tag = COALESCE(display_name, 'Player') || '#' || lpad(floor(random() * 10000)::text, 4, '0')
WHERE player_tag IS NULL;
