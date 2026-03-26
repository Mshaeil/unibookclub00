"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Lock, Loader2, MessageCircle, Send } from "lucide-react"

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

type MsgRow = {
  id: string
  body: string
  created_at: string
  sender_id: string
}

function one<T>(x: T | T[] | null): T | null {
  if (!x) return null
  return Array.isArray(x) ? x[0] ?? null : x
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
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bootstrappedListing, setBootstrappedListing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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
          "جداول المحادثات غير مُنشأة بعد. نفّذ سكربت scripts/012_messaging_admin_promote.sql في Supabase.",
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
    const data = (await res.json().catch(() => ({}))) as { messages?: MsgRow[]; error?: string }
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
        /* realtime refresh — avoid spamming errors */
      }
    },
    [fetchMessagesFromApi],
  )

  useEffect(() => {
    if (!listingFromUrl || bootstrappedListing) return
    let cancelled = false
    ;(async () => {
      setBootstrappedListing(true)
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
          void refreshThreadQuiet(activeId)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeId, supabase, refreshThreadQuiet])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, activeId])

  async function sendMessage() {
    const text = draft.trim()
    if (!activeId || !text || sending) return
    setSending(true)
    setError(null)
    const res = await fetch("/api/messages", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: activeId, body: text }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string }
    setSending(false)
    if (!res.ok) {
      setError([data.error, data.hint].filter(Boolean).join(" — "))
      return
    }
    setDraft("")
    void loadConversations()
    void refreshThreadQuiet(activeId)
  }

  const activeConv = conversations.find((c) => c.id === activeId)
  const listing = one(activeConv?.listing ?? null)
  const partnerName =
    activeConv?.buyer_id === userId
      ? one(activeConv?.seller ?? null)?.full_name
      : one(activeConv?.buyer ?? null)?.full_name

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">الرسائل</h1>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />
          الرسائل تُخزَّن مشفّرة على الخادم (AES-256-GCM) وتُنقل عبر HTTPS. فريق الدعم يمكنه الاطلاع عند
          الحاجة عبر لوحة الإدارة وفق سياسة المنصة.
        </p>
      </div>

      {error && (
        <Card className="mb-4 border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr] min-h-[420px]">
        <Card className="md:min-h-[420px] overflow-hidden transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="py-3">
            <CardTitle className="text-base">محادثاتك</CardTitle>
            <CardDescription className="text-xs">مع البائعين والمشترين حول الإعلانات</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                لا توجد محادثات بعد. افتح إعلاناً واختر «محادثة مباشرة» من «تواصل مع البائع».
              </div>
            ) : (
              <ScrollArea className="h-[320px] md:h-[360px]">
                <ul className="divide-y divide-border">
                  {conversations.map((c) => {
                    const li = one(c.listing ?? null)
                    const isBuyer = c.buyer_id === userId
                    const other = isBuyer ? one(c.seller ?? null) : one(c.buyer ?? null)
                    const label = li?.title || "إعلان"
                    const sub = other?.full_name || "مستخدم"
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => void openThread(c.id)}
                          className={`w-full text-right px-4 py-3 text-sm transition-colors duration-200 hover:bg-muted/80 ${
                            activeId === c.id ? "bg-primary/10 border-s-2 border-primary" : ""
                          }`}
                        >
                          <div className="font-medium line-clamp-1">{label}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{sub}</div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col md:min-h-[420px] overflow-hidden transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="py-3 border-b shrink-0">
            {activeConv && listing ? (
              <>
                <CardTitle className="text-base line-clamp-1">{listing.title}</CardTitle>
                <CardDescription className="text-xs">
                  مع {partnerName || "المستخدم"} ·{" "}
                  <Link href={`/book/${listing.id}`} className="text-primary hover:underline">
                    عرض الإعلان
                  </Link>
                </CardDescription>
              </>
            ) : (
              <CardTitle className="text-base text-muted-foreground">اختر محادثة</CardTitle>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {!activeId ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm p-8">
                <MessageCircle className="h-10 w-10 opacity-30 mb-2" />
              </div>
            ) : loadingThread ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 h-[240px] md:h-[280px] p-4">
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const mine = m.sender_id === userId
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              mine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p
                              className={`text-[10px] mt-1 opacity-70 ${mine ? "text-primary-foreground" : ""}`}
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
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-3 flex gap-2 shrink-0 bg-muted/20">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="اكتب رسالتك…"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void sendMessage()
                      }
                    }}
                  />
                  <Button type="button" onClick={() => void sendMessage()} disabled={sending || !draft.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
