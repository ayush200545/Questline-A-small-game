-- Questline Ultimate: Guilds Schema
-- Run this in your Supabase SQL Editor to enable Phase 2: Guilds!

CREATE TABLE IF NOT EXISTS public.guilds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL UNIQUE, -- e.g. [KNIGHTS]
    description TEXT,
    leader_id UUID REFERENCES auth.users(id) NOT NULL,
    total_xp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guild_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'officer', 'leader')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(guild_id, user_id)
);

ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view guilds" ON public.guilds FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create guilds" ON public.guilds FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Guild leaders can update guilds" ON public.guilds FOR UPDATE USING (auth.uid() = leader_id);

CREATE POLICY "Anyone can view guild members" ON public.guild_members FOR SELECT USING (true);
CREATE POLICY "Users can join guilds" ON public.guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can leave guilds" ON public.guild_members FOR DELETE USING (auth.uid() = user_id);
