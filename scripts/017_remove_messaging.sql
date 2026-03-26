-- إزالة جداول ودوال المحادثات والرسائل من Supabase (اختياري — بعد حذف الكود من التطبيق)
-- لا يحذف admin_promote_by_email (يبقى في 012). نفّذ في SQL Editor.

DROP TRIGGER IF EXISTS on_message_touch_conversation ON public.messages;

DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid);

-- إزالة عمود cipher_blob إن وُجد بدون الجدول (حالة جزئية)
-- ALTER TABLE public.messages DROP COLUMN IF EXISTS cipher_blob; -- الجدول محذوف أعلاه

-- Realtime: من لوحة Supabase → Database → Replication أزل الجداول المحذوفة من المنشور إن ظهرت.
