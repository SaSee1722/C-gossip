-- GOSSIP Supabase Schema Setup (Safe Version)
-- 1. Tables Creation
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    bio TEXT,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id)
);
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    description TEXT,
    icon_url TEXT,
    is_group BOOLEAN DEFAULT FALSE,
    admin_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.chat_participants (
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_locked BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (chat_id, user_id)
);
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio')),
    media_url TEXT,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE
    SET NULL,
        reactions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. RLS CLEANUP & RECREATION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR
UPDATE USING (auth.uid() = id);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own connections." ON public.connections;
DROP POLICY IF EXISTS "Users can create connections." ON public.connections;
DROP POLICY IF EXISTS "Users can update their own connections." ON public.connections;
CREATE POLICY "Users can view their own connections." ON public.connections FOR
SELECT USING (
        auth.uid() = requester_id
        OR auth.uid() = receiver_id
    );
CREATE POLICY "Users can create connections." ON public.connections FOR
INSERT WITH CHECK (auth.uid() = requester_id);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User can view chats they are in." ON public.chats;
CREATE POLICY "User can view chats they are in." ON public.chats FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.chat_participants
            WHERE chat_id = id
                AND user_id = auth.uid()
        )
    );
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User can view participants of their chats." ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
CREATE POLICY "Users can view their own participant records" ON public.chat_participants FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view participants in their chats" ON public.chat_participants FOR
SELECT USING (
        chat_id IN (
            SELECT id
            FROM public.chats
        )
    );
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User can view messages in their chats." ON public.messages;
DROP POLICY IF EXISTS "User can insert messages in their chats." ON public.messages;
CREATE POLICY "User can view messages in their chats." ON public.messages FOR
SELECT USING (
        chat_id IN (
            SELECT id
            FROM public.chats
        )
    );
CREATE POLICY "User can insert messages in their chats." ON public.messages FOR
INSERT WITH CHECK (
        chat_id IN (
            SELECT id
            FROM public.chats
        )
        AND auth.uid() = sender_id
    );
-- 3. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.profiles (id, username, full_name, avatar_url)
VALUES (
        new.id,
        split_part(new.email, '@', 1),
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    ) ON CONFLICT (id) DO NOTHING;
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();