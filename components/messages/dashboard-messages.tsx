"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Copy,
  Hash,
  ImageIcon,
  Loader2,
  Lock,
  MessageCircle,
  Paperclip,
  Send,
  Smile,
  Store,
  User,
  X,
} from "lucide-react"

type ConvRow = {
  id: string
  updated_at: string
  listing_id: string
  buyer_id: string
  seller_id: string
  listing: { id: string; title: string } | { id: string; title: string }[] | null
  buyer: { id: string; full_name: string | null } | null
  seller: { id: string; full_name: string | null } | null
}

type MsgAttachment = {
  pathname: string
  name: string
  mime: string
}

type MsgRow = {
  id: string
  body: string
  attachments?: MsgAttachment[]
  created_at: string
  sender_id: string
}

const MAX_MESSAGE_ATTACHMENTS = 6

function isProbablyImage(att: MsgAttachment) {
  if (att.mime.startsWith("image/")) return true
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(att.name)
}

function fileUrl(pathname: string) {
  return `/api/file?pathname=${encodeURIComponent(pathname)}`
}

const QUICK_EMOJIS = [
  "😀", "😊", "👍", "🙏", "❤️", "🔥", "✨", "👋",
  "😂", "🤝", "💯", "⭐", "📚", "✅", "⏰", "💬",
  "🙂", "😅", "🎓", "📖", "💰", "🛒", "📍", "☕",
  "🙌", "💪", "🤔", "👌", "📝", "📎", "🔔", "🌟",
]

function one<T>(x: T | T[] | null): T | null {
  if (!x) return null
  return Array.isArray(x) ? x[0] ?? null : x
}

function listingCode(id: string) {
  return id.replace(/-/g, "").slice(0, 10).toUpperCase()
}

export default function DashboardMessages({
  userId,
  initialListingId,
}: {
  userId: string
  initialListingId?: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const listingFromUrl = searchParams.get("listing") || initialListingId || undefined

  const [conversations, setConversations] = useState<ConvRow[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [draft, setDraft] = useState("")
  const [attachments, setAttachments] = useState<MsgAttachment[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bootstrappedListing, setBootstrappedListing] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listScrollRef = useRef<HTMLDivElement>(null)
  const threadScrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadConversations = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from("conversations")
      .select(
        `
        id,
        updated_at,
        listing_id,
        buyer_id,
        seller_id,
        listing:listings(id, title),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name),
        seller:profiles!conversations_seller_id_fkey(id, full_name)
      `,
      )
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("updated_at", { ascending: false })

    if (qErr) {
      if (qErr.code === "PGRST205" || /does not exist/i.test(qErr.message)) {
        setError(
          "جداول المحادثات غير مُنشأة بعد. نفّذ سكربت 012 في Supabase.",
        )
      } else {
        setError(qErr.message)
      }
      setConversations([])
    } else {
      setConversations((data as unknown as ConvRow[]) || [])
    }
    setLoadingList(false)
  }, [supabase, userId])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  const fetchMessagesFromApi = useCallback(async (conversationId: string) => {
    const res = await fetch(
      `/api/messages?conversation_id=${encodeURIComponent(conversationId)}`,
      { credentials: "same-origin" },
    )
    const data = (await res.json().catch(() => ({}))) as {
      messages?: MsgRow[]
      error?: string
    }
    if (!res.ok) {
      throw new Error(data.error || res.statusText || "فشل تحميل الرسائل")
    }
    return data.messages ?? []
  }, [])

  const openThread = useCallback(
    async (conversationId: string) => {
      setActiveId(conversationId)
      setLoadingThread(true)
      setError(null)
      try {
        const list = await fetchMessagesFromApi(conversationId)
        setMessages(list)
      } catch (e) {
        setError(e instanceof Error ? e.message : "فشل تحميل الرسائل")
        setMessages([])
      } finally {
        setLoadingThread(false)
      }
    },
    [fetchMessagesFromApi],
  )

  const refreshThreadQuiet = useCallback(
    async (conversationId: string) => {
      try {
        const list = await fetchMessagesFromApi(conversationId)
        setMessages(list)
      } catch {
        /* ignore */
      }
    },
    [fetchMessagesFromApi],
  )

  const scheduleThreadRefresh = useCallback(
    (conversationId: string) => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current)
      }
      refreshDebounceRef.current = setTimeout(() => {
        refreshDebounceRef.current = null
        void refreshThreadQuiet(conversationId)
      }, 400)
    },
    [refreshThreadQuiet],
  )

  useEffect(() => {
    if (!listingFromUrl || bootstrappedListing) return
    let cancelled = false
    ;(async () => {
      setBootstrappedListing(true)
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        await ensureUserProfile(supabase, u)
      }
      const { data: cid, error: rpcErr } = await supabase.rpc("get_or_create_conversation", {
        p_listing_id: listingFromUrl,
      })
      if (cancelled) return
      if (rpcErr) {
        setError(rpcErr.message)
        router.replace("/dashboard/messages")
        return
      }
      if (typeof cid === "string") {
        await loadConversations()
        setActiveId(cid)
        await openThread(cid)
        router.replace("/dashboard/messages")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    listingFromUrl,
    bootstrappedListing,
    supabase,
    router,
    loadConversations,
    openThread,
  ])

  useEffect(() => {
    if (!activeId) return
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => {
          scheduleThreadRefresh(activeId)
        },
      )
      .subscribe()

    return () => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current)
      }
      void supabase.removeChannel(channel)
    }
  }, [activeId, supabase, scheduleThreadRefresh])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" })
  }, [messages.length, activeId])

  async function uploadAttachments(files: FileList | null) {
    if (!files?.length) return
    const list = Array.from(files).slice(0, MAX_MESSAGE_ATTACHMENTS - attachments.length)
    if (list.length === 0) return
    setUploadingFiles(true)
    setError(null)
    try {
      const next: MsgAttachment[] = [...attachments]
      for (const file of list) {
        if (next.length >= MAX_MESSAGE_ATTACHMENTS) break
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
          credentials: "same-origin",
        })
        const data = (await res.json().catch(() => ({}))) as {
          pathname?: string
          error?: string
        }
        if (!res.ok || !data.pathname) {
          throw new Error(data.error || "فشل رفع الملف")
        }
        next.push({
          pathname: data.pathname,
          name: file.name,
          mime: file.type || "",
        })
      }
      setAttachments(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل رفع المرفقات")
    } finally {
      setUploadingFiles(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function sendMessage() {
    const text = draft.trim()
    if (!activeId || sending || uploadingFiles) return
    if (!text && attachments.length === 0) return
    setSending(true)
    setError(null)
    const res = await fetch("/api/messages", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: activeId,
        body: text,
        attachments: attachments.length ? attachments : undefined,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string }
    setSending(false)
    if (!res.ok) {
      setError([data.error, data.hint].filter(Boolean).join(" — "))
      return
    }
    setDraft("")
    setAttachments([])
    void loadConversations()
    void refreshThreadQuiet(activeId)
  }

  function insertEmoji(e: string) {
    setDraft((d) => d + e)
    setEmojiOpen(false)
  }

  function copyListingId(id: string) {
    void navigator.clipboard?.writeText(id)
  }

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  )
  const listing = one(activeConv?.listing ?? null)
  const sellerP = one(activeConv?.seller ?? null)
  const buyerP = one(activeConv?.buyer ?? null)
  const imBuyer = activeConv?.buyer_id === userId
  const partnerName = imBuyer ? sellerP?.full_name : buyerP?.full_name
  const sellerName = sellerP?.full_name ?? "—"
  const buyerName = buyerP?.full_name ?? "—"

  return (
    <div className="mx-auto flex min-h-0 max-w-5xl flex-col px-3 py-4 md:px-4 md:py-6">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">الرسائل</h1>
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-foreground/90"
          role="status"
        >
          <Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            الرسائل <strong>مشفّرة على الخادم</strong> — يمكن إرفاق صور أو ملفات (بعد الرفع) ضمن نفس الرسالة المشفّرة.
          </span>
        </div>
      </div>

      {error ? (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-[min(72dvh,640px)] flex-1 gap-3 md:grid-cols-[minmax(0,260px)_1fr]">
        {/* قائمة المحادثات — تمرير أصلي خفيف */}
        <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-3 py-2.5">
            <p className="text-sm font-semibold">المحادثات</p>
            <p className="text-[11px] text-muted-foreground">حسب الإعلان</p>
          </div>
          <div ref={listScrollRef} className="min-h-[200px] flex-1 overflow-y-auto overscroll-contain md:max-h-[min(72dvh,640px)]">
            {loadingList ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground opacity-70" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                لا توجد محادثات. من صفحة إعلان اختر «تواصل مع البائع» ثم «محادثة مباشرة».
              </p>
            ) : (
              <ul>
                {conversations.map((c) => {
                  const li = one(c.listing ?? null)
                  const isBuyerRow = c.buyer_id === userId
                  const other = isBuyerRow ? one(c.seller ?? null) : one(c.buyer ?? null)
                  const roleLabel = isBuyerRow ? "البائع" : "المشتري"
                  return (
                    <li key={c.id} className="border-b border-border/60 last:border-0">
                      <button
                        type="button"
                        onClick={() => void openThread(c.id)}
                        className={`w-full px-3 py-2.5 text-right transition-colors hover:bg-muted/70 ${
                          activeId === c.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="line-clamp-1 text-sm font-medium">{li?.title || "إعلان"}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5 font-mono">
                            <Hash className="h-3 w-3" />
                            {listingCode(li?.id || c.listing_id)}
                          </span>
                          <span>
                            {roleLabel}: {other?.full_name || "—"}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* خيط المحادثة */}
        <div className="flex min-h-[min(72dvh,640px)] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 opacity-25" strokeWidth={1.25} />
              <p className="text-sm">اختر محادثة من القائمة</p>
            </div>
          ) : (
            <>
              <div className="shrink-0 space-y-2 border-b bg-muted/20 px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">
                      {listing?.title || "إعلان"}
                    </p>
                    <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                      <span className="inline-flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 shrink-0" />
                        البائع:{" "}
                        <strong className="text-foreground">{sellerName}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        المشتري:{" "}
                        <strong className="text-foreground">{buyerName}</strong>
                      </span>
                    </div>
                  </div>
                  {listing ? (
                    <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs" asChild>
                      <Link href={`/book/${listing.id}`}>عرض الإعلان</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" disabled>
                      عرض الإعلان
                    </Button>
                  )}
                </div>
                {listing ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-md bg-background/80 px-2 py-1.5 font-mono text-[11px]">
                    <span className="text-muted-foreground">رمز الإعلان:</span>
                    <span className="select-all text-foreground">{listing.id}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="نسخ رمز الإعلان"
                      onClick={() => copyListingId(listing.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
                <p className="text-[11px] text-muted-foreground">
                  تتحدث مع: <strong className="text-foreground">{partnerName || "—"}</strong>
                </p>
              </div>

              <div
                ref={threadScrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
              >
                {loadingThread ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground opacity-70" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((m) => {
                      const mine = m.sender_id === userId
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[min(92%,420px)] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              mine
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md bg-muted text-foreground"
                            }`}
                          >
                            {m.body ? (
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            ) : null}
                            {m.attachments && m.attachments.length > 0 ? (
                              <div
                                className={`space-y-2 ${m.body ? "mt-2" : ""}`}
                              >
                                {m.attachments.map((att) =>
                                  isProbablyImage(att) ? (
                                    <a
                                      key={att.pathname}
                                      href={fileUrl(att.pathname)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block overflow-hidden rounded-lg border border-white/20"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={fileUrl(att.pathname)}
                                        alt={att.name}
                                        className="max-h-48 w-full object-contain bg-black/10"
                                        loading="lazy"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      key={att.pathname}
                                      href={fileUrl(att.pathname)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium underline-offset-2 hover:underline ${
                                        mine
                                          ? "border-primary-foreground/30 bg-primary-foreground/10"
                                          : "border-border bg-background"
                                      }`}
                                    >
                                      <Paperclip className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                      {att.name}
                                    </a>
                                  ),
                                )}
                              </div>
                            ) : null}
                            <p
                              className={`mt-1 text-[10px] opacity-70 ${
                                mine ? "text-primary-foreground" : ""
                              }`}
                            >
                              {new Date(m.created_at).toLocaleString("ar-JO", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} className="h-px shrink-0" />
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t bg-muted/10 p-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                  onChange={(e) => void uploadAttachments(e.target.files)}
                />
                {attachments.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attachments.map((a) => (
                      <span
                        key={a.pathname}
                        className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px]"
                      >
                        {isProbablyImage(a) ? (
                          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{a.name}</span>
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-muted"
                          aria-label="إزالة"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((x) => x.pathname !== a.pathname),
                            )
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    aria-label="إرفاق ملف أو صورة"
                    disabled={
                      uploadingFiles ||
                      attachments.length >= MAX_MESSAGE_ATTACHMENTS ||
                      !activeId
                    }
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingFiles ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        aria-label="إيموجي"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-2" align="end" side="top">
                      <div className="grid grid-cols-8 gap-0.5">
                        {QUICK_EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted"
                            onClick={() => insertEmoji(em)}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="اكتب رسالتك…"
                    rows={1}
                    className="min-h-10 max-h-32 flex-1 resize-y py-2.5"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void sendMessage()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => void sendMessage()}
                    disabled={
                      sending ||
                      uploadingFiles ||
                      (!draft.trim() && attachments.length === 0)
                    }
                    aria-label="إرسال"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground px-0.5">
                  مرفقات: صور (حتى 5 ميجا) أو PDF/Word/PowerPoint/ZIP/نص (حتى 10 ميجا) — حتى{" "}
                  {MAX_MESSAGE_ATTACHMENTS} ملفات لكل رسالة.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
