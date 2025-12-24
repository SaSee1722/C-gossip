-- Vibe Views Table
CREATE TABLE IF NOT EXISTS public.vibe_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vibe_id UUID REFERENCES public.vibes(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vibe_id, viewer_id)
);

-- RLS for Vibe Views
ALTER TABLE public.vibe_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can see views" ON public.vibe_views;
CREATE POLICY "Anyone can see views" ON public.vibe_views FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can record a view" ON public.vibe_views;
CREATE POLICY "Anyone can record a view" ON public.vibe_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
