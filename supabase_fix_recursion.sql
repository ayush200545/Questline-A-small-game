-- Emergency Fix: Infinite Recursion in Row Level Security

-- 1. Automatically find and drop ALL existing policies on the user_stats table to clear the corruption
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_stats' AND schemaname = 'public') 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.user_stats'; 
    END LOOP; 
END $$;

-- 2. Re-create the 3 essential policies cleanly (without any self-referencing queries)

-- Allow the Leaderboard to view everyone's stats
CREATE POLICY "Anyone can view user stats" 
ON public.user_stats 
FOR SELECT 
USING (true);

-- Allow new users to create their initial profile
CREATE POLICY "Users can insert their own stats" 
ON public.user_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to save their Settings profile
CREATE POLICY "Users can update their own stats" 
ON public.user_stats 
FOR UPDATE 
USING (auth.uid() = user_id);
