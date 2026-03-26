-- Buyer–seller messaging, admin read-only visibility, promote admin by email
-- Run in Supabase SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- Stronger profile names for OAuth (Google uses "name", "full_name", etc.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, whatsapp, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(trim(split_part(NEW.email, '@', 1)), ''),
      'مستخدم'
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', null),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', null),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = CASE
      WHEN trim(COALESCE(public.profiles.full_name, '')) = ''
        OR public.profiles.full_name = 'مستخدم'
      THEN COALESCE(
        NULLIF(trim(EXCLUDED.full_name), ''),
        public.profiles.full_name
      )
      ELSE public.profiles.full_name
    END;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Conversations & messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_buyer_not_seller CHECK (buyer_id <> seller_id),
  CONSTRAINT conversations_unique_listing_buyer UNIQUE (listing_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 4000 AND char_length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_touch_conversation ON public.messages;
CREATE TRIGGER on_message_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
CREATE POLICY "conversations_select_participants"
  ON public.conversations FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "conversations_insert_buyer" ON public.conversations;
CREATE POLICY "conversations_insert_buyer"
  ON public.conversations FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND seller_id = (SELECT l.seller_id FROM public.listings l WHERE l.id = listing_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.buyer_id = auth.uid()
          OR c.seller_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "messages_insert_sender_participant" ON public.messages;
CREATE POLICY "messages_insert_sender_participant"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Admins can read but not insert messages (no INSERT policy for admin).

-- ---------------------------------------------------------------------------
-- RPC: atomic conversation for listing (buyer = caller)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  sid uuid;
  cid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT seller_id INTO sid FROM public.listings WHERE id = p_listing_id;
  IF sid IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF sid = uid THEN
    RAISE EXCEPTION 'cannot message yourself';
  END IF;

  SELECT id INTO cid
  FROM public.conversations
  WHERE listing_id = p_listing_id AND buyer_id = uid;

  IF cid IS NOT NULL THEN
    RETURN cid;
  END IF;

  INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
  VALUES (p_listing_id, uid, sid)
  RETURNING id INTO cid;

  RETURN cid;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: promote user to admin by email (callers must already be admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_promote_by_email(target_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF target_email IS NULL OR trim(target_email) = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.profiles p
  SET role = 'admin'
  FROM auth.users u
  WHERE u.id = p.id
    AND lower(trim(u.email::text)) = lower(trim(target_email));

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_promote_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_promote_by_email(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (Supabase): replicate messages. Ignore error if already added.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Optional: encrypted message bodies at rest — run scripts/013_messages_cipher_blob.sql and set MESSAGE_ENCRYPTION_KEY on the app server (openssl rand -hex 32).
