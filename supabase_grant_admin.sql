-- Run this script ONLY AFTER you have signed up in the app with the email 'admin@questline.com'
-- This will securely upgrade that specific account to the God Mode Admin role!

UPDATE public.user_stats 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@questline.com' );
