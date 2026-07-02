-- Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    stack TEXT,
    component_stack TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Allow anyone to insert error logs (even unauthenticated users might encounter login errors)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs" 
ON public.error_logs FOR INSERT 
WITH CHECK (true);

-- Only admins should read error logs (for now, no read policy needed for users)
