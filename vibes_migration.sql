-- Vibes Table
CREATE TABLE IF NOT EXISTS public.vibes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('image', 'video')) NOT NULL,
    media_url TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- RLS for Vibes
ALTER TABLE public.vibes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can see vibes" ON public.vibes;
CREATE POLICY "Anyone can see vibes" ON public.vibes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own vibes" ON public.vibes;
CREATE POLICY "Users can create their own vibes" ON public.vibes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own vibes" ON public.vibes;
CREATE POLICY "Users can delete their own vibes" ON public.vibes FOR DELETE USING (auth.uid() = user_id);
