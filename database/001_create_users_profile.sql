-- Users table for public profile
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    favorite_color TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to sync from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, now())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only allow users to read/update their own profile
CREATE POLICY user_select_own ON public.users
    FOR SELECT USING (id = auth.uid());
CREATE POLICY user_update_own ON public.users
    FOR UPDATE USING (id = auth.uid());
-- Admin can read/update all
CREATE POLICY admin_select_all ON public.users
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email LIKE '%admin%'));
CREATE POLICY admin_update_all ON public.users
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email LIKE '%admin%'));
