-- Application-level encryption for messages (cipher_blob). Run after 012_messaging_admin_promote.sql
-- Set MESSAGE_ENCRYPTION_KEY in the app host (64 hex chars from: openssl rand -hex 32)

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_body_check;

ALTER TABLE public.messages ALTER COLUMN body DROP NOT NULL;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS cipher_blob TEXT;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_body_or_cipher;

ALTER TABLE public.messages ADD CONSTRAINT messages_body_or_cipher CHECK (
  (
    cipher_blob IS NOT NULL
    AND body IS NULL
    AND length(trim(cipher_blob)) >= 32
  )
  OR (
    cipher_blob IS NULL
    AND body IS NOT NULL
    AND char_length(trim(body)) > 0
    AND char_length(body) <= 4000
  )
);

COMMENT ON COLUMN public.messages.cipher_blob IS 'AES-256-GCM payload (base64: iv + ciphertext + tag). Plain body NULL when set.';
COMMENT ON COLUMN public.messages.body IS 'Legacy plaintext row before encryption migration; NULL for new encrypted rows.';
