import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  decryptMessageBlob,
  encryptMessagePlaintext,
  getMessageEncryptionKey,
} from "@/lib/server/message-crypto"
import {
  isSafeListingStoragePath,
  parseMessagePayload,
  stringifyMessagePayload,
  type MessageAttachment,
} from "@/lib/messages/payload"

type MessageRow = {
  id: string
  body: string | null
  cipher_blob: string | null
  created_at: string
  sender_id: string
  conversation_id: string
}

export type ApiMessage = {
  id: string
  body: string
  attachments: MessageAttachment[]
  created_at: string
  sender_id: string
}

function toPlainMessage(row: MessageRow): ApiMessage {
  const raw = row.cipher_blob
    ? (() => {
        try {
          return decryptMessageBlob(row.cipher_blob)
        } catch {
          return "[تعذر فك تشفير الرسالة — تحقق من مفتاح الخادم]"
        }
      })()
    : (row.body?.trim() ?? "")

  const { text, attachments } = parseMessagePayload(raw)
  return {
    id: row.id,
    body: text,
    attachments,
    created_at: row.created_at,
    sender_id: row.sender_id,
  }
}

async function assertReadAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationId: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const [{ data: profile }, { data: conv, error: convErr }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase
      .from("conversations")
      .select("id, buyer_id, seller_id")
      .eq("id", conversationId)
      .maybeSingle(),
  ])

  if (convErr || !conv) {
    return { ok: false, status: 404, message: "المحادثة غير موجودة" }
  }

  const isAdmin = profile?.role === "admin"
  const isParticipant = conv.buyer_id === userId || conv.seller_id === userId
  if (!isAdmin && !isParticipant) {
    return { ok: false, status: 403, message: "غير مصرح" }
  }
  return { ok: true }
}

function encryptionNotReadyResponse() {
  return NextResponse.json(
    {
      error:
        "تشفير الرسائل غير مُعدّ: أضف MESSAGE_ENCRYPTION_KEY في بيئة الخادم (مثلاً مخرجات openssl rand -hex 32).",
    },
    { status: 503 },
  )
}

/** GET: list decrypted messages (participant or admin) */
export async function GET(request: NextRequest) {
  try {
    getMessageEncryptionKey()
  } catch {
    return encryptionNotReadyResponse()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const conversationId = request.nextUrl.searchParams.get("conversation_id")?.trim()
  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id مطلوب" }, { status: 400 })
  }

  const access = await assertReadAccess(supabase, user.id, conversationId)
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status })
  }

  const { data: rows, error } = await supabase
    .from("messages")
    .select("id, body, cipher_blob, created_at, sender_id, conversation_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const messages = ((rows || []) as MessageRow[]).map(toPlainMessage)
  return NextResponse.json({ messages })
}

const MAX_ATTACHMENTS = 6

type PostJson = {
  conversation_id?: string
  body?: string
  attachments?: { pathname?: string; name?: string; mime?: string }[]
}

/** POST: send encrypted message (buyer or seller only) */
export async function POST(request: NextRequest) {
  try {
    getMessageEncryptionKey()
  } catch {
    return encryptionNotReadyResponse()
  }

  let json: PostJson
  try {
    json = (await request.json()) as PostJson
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 })
  }

  const conversationId = String(json.conversation_id ?? "").trim()
  const text = typeof json.body === "string" ? json.body : ""
  const rawAtt = Array.isArray(json.attachments) ? json.attachments : []

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id مطلوب" }, { status: 400 })
  }

  if (rawAtt.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { error: `الحد الأقصى ${MAX_ATTACHMENTS} مرفقات` },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const attachments: MessageAttachment[] = []
  for (const a of rawAtt) {
    const pathname = typeof a.pathname === "string" ? a.pathname.trim() : ""
    if (!pathname) continue
    if (!isSafeListingStoragePath(pathname, user.id)) {
      return NextResponse.json(
        { error: "مسار مرفق غير صالح — ارفع الملف من نفس الحساب عبر الزر المخصص" },
        { status: 400 },
      )
    }
    const name =
      typeof a.name === "string" && a.name.trim()
        ? a.name.trim().slice(0, 240)
        : pathname.split("/").pop() || "مرفق"
    const mime = typeof a.mime === "string" ? a.mime.trim().slice(0, 120) : ""
    attachments.push({ pathname, name, mime })
  }

  if (text.trim().length === 0 && attachments.length === 0) {
    return NextResponse.json(
      { error: "أضف نصاً أو مرفقاً واحداً على الأقل" },
      { status: 400 },
    )
  }

  let payload: string
  try {
    payload = stringifyMessagePayload(text, attachments)
  } catch (e) {
    if (e instanceof Error && e.message === "empty payload") {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 })
    }
    return NextResponse.json({ error: "تعذر تجهيز الرسالة" }, { status: 400 })
  }

  let cipherBlob: string
  try {
    cipherBlob = encryptMessagePlaintext(payload)
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "message too long") {
        return NextResponse.json({ error: "الرسالة أطول من المسموح" }, { status: 400 })
      }
      if (e.message === "empty message") {
        return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 })
      }
    }
    return NextResponse.json({ error: "فشل التشفير" }, { status: 500 })
  }

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (convErr || !conv) {
    return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 })
  }

  if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
    return NextResponse.json({ error: "فقط أطراف المحادثة يمكنهم الإرسال" }, { status: 403 })
  }

  const { error: insErr } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: null,
    cipher_blob: cipherBlob,
  })

  if (insErr) {
    return NextResponse.json(
      {
        error: insErr.message,
        hint:
          /cipher|column|schema/i.test(insErr.message)
            ? "نفّذ scripts/013_messages_cipher_blob.sql في Supabase إن لم يكن مُنفَّذاً."
            : undefined,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
