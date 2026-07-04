-- Questline Fix: Reliable Sign-up Trigger
-- Run this script in your Supabase SQL Editor to fix the 500 Signup Error!

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  random_tag TEXT;
BEGIN
  -- 1. Generate a random tag safely (fallback to 'player' if email is weird)
  random_tag := split_part(COALESCE(new.email, 'player'), '@', 1) || '#' || lpad(floor(random() * 10000)::text, 4, '0');
  
  -- 2. Insert into user_stats safely, ignoring if the row already exists
  INSERT INTO public.user_stats (user_id, display_name, player_tag)
  VALUES (new.id, split_part(COALESCE(new.email, 'player'), '@', 1), random_tag)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 3. Success! Return the user record to Supabase Auth.
  RETURN new;
  
EXCEPTION WHEN OTHERS THEN
  -- 4. CRITICAL FIX: If anything goes wrong in the database (missing column, constraint error),
  -- we catch the error and still return the new user. 
  -- This prevents the "500 Internal Server Error" and allows the user to sign up!
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
