-- Questline Ultimate Migration & Schema Script
-- This adds the Social Graph, Economy, and Guild tables.

-- 1. Add Player Tag & Currency to User Stats
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS player_tag TEXT UNIQUE;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS xp_multiplier NUMERIC DEFAULT 1.0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS active_theme TEXT DEFAULT 'neo-default';

-- Update handle_new_user to generate a random 4-digit player tag
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  random_tag TEXT;
BEGIN
  -- Generate a random tag like username#1234
  random_tag := split_part(new.email, '@', 1) || '#' || lpad(floor(random() * 10000)::text, 4, '0');
  
  INSERT INTO public.user_stats (user_id, display_name, player_tag)
  VALUES (new.id, split_part(new.email, '@', 1), random_tag);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    friend_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their friendships" ON public.friendships 
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. Competitions (1v1 Duels) Table
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenger_id UUID REFERENCES auth.users(id) NOT NULL,
    defender_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL, -- e.g., 'race_to_1000_xp'
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    challenger_score INTEGER DEFAULT 0,
    defender_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their duels" ON public.competitions 
    FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = defender_id);
CREATE POLICY "Users can create duels" ON public.competitions 
    FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update their duels" ON public.competitions 
    FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = defender_id);

-- 4. Shop Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    item_type TEXT NOT NULL, -- e.g., 'streak_freeze', 'xp_booster', 'theme_cyberpunk'
    quantity INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their inventory" ON public.inventory 
    FOR ALL USING (auth.uid() = user_id);
