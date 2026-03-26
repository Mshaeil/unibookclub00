"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Eye, Loader2, Paperclip } from "lucide-react"

type Conv = {
  id: string
  updated_at: string
  listing_id: string
  listing: { title: string } | { title: string }[] | null
  buyer: { full_name: string | null; email: string | null } | null
  seller: { full_name: string | null; email: string | null } | null
}

type MsgAtt = { pathname: string; name: string; mime: string }

type Msg = {
  id: string
  body: string
  attachments?: MsgAtt[]
  created_at: string
  sender_id: string
}

function isProbablyImage(att: MsgAtt) {
  if (att.mime.startsWith("image/")) return true
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(att.name)
}

function fileUrl(pathname: string) {
  return `/api/file?pathname=${encodeURIComponent(pathname)}`
}

function one<T>(x: T | T[] | null): T | null {
  if (!x) return null
  return Array.isArray(x) ? x[0] ?? null : x
}

export function AdminMessagesPanel() {
  const supabase = useMemo(() => createClient(), [])
  const [conversations, setConversations] = useState<Conv[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from("conversations")
      .select(
        `
        id,
        updated_at,
        listing_id,
        listing:listings(title),
        buyer:profiles!conversations_buyer_id_fkey(full_name, email),
        seller:profiles!conversations_seller_id_fkey(full_name, email)
      `,
      )
      .order("updated_at", { ascending: false })
      .limit(100)

    if (qErr) {
      if (qErr.code === "PGRST205" || /does not exist/i.test(qErr.message)) {
        setError("تشغّل سكربت scripts/012_messaging_admin_promote.sql أولاً.")
      } else {
        setError(qErr.message)
      }
      setConversations([])
    } else {
      setConversations((data as unknown as Conv[]) || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  const openThread = useCallback(async (id: string) => {
    setActiveId(id)
    setLoadingMsgs(true)
    setError(null)
    try {
      const res = await fetch(`/api/messages?conversation_id=${encodeURIComponent(id)}`, {
        credentials: "same-origin",
      })
      const data = (await res.json().catch(() => ({}))) as { messages?: Msg[]; error?: string }
      if (!res.ok) {
        setError(data.error || "فشل تحميل الرسائل")
        setMessages([])
      } else {
        setMessages(data.messages ?? [])
      }
    } catch {
      setError("فشل الاتصال بالخادم")
      setMessages([])
    }
    setLoadingMsgs(false)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          مراقبة المحادثات
        </CardTitle>
        <CardDescription>
          عرض الرسائل بعد فك التشفير على الخادم (نفس مفتاح التخزين). للاطلاع فقط — لا يظهر للمستخدمين أن الجلسة
          قيد المراقبة. لا يمكن الإرسال من هذه الشاشة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[minmax(0,300px)_1fr] min-h-[360px]">
            <ScrollArea className="h-[360px] rounded-lg border">
              <ul className="divide-y">
                {conversations.map((c) => {
                  const li = one(c.listing)
                  const title = li?.title || "إعلان"
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => void openThread(c.id)}
                        className={`w-full text-right px-3 py-2.5 text-sm hover:bg-muted/80 transition-colors ${
                          activeId === c.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="font-medium line-clamp-1">{title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(c.updated_at).toLocaleString("ar-JO")}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
            <div className="rounded-lg border bg-muted/20 min-h-[360px] flex flex-col">
              {!activeId ? (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6">
                  اختر محادثة من القائمة
                </div>
              ) : loadingMsgs ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="border-b px-4 py-2 text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
                    {(() => {
                      const c = conversations.find((x) => x.id === activeId)
                      if (!c) return null
                      const b = one(c.buyer)
                      const s = one(c.seller)
                      return (
                        <>
                          <Badge variant="outline">مشتري: {b?.full_name || "—"}</Badge>
                          <span className="truncate max-w-[140px]">{b?.email || ""}</span>
                          <Badge variant="secondary">بائع: {s?.full_name || "—"}</Badge>
                          <span className="truncate max-w-[140px]">{s?.email || ""}</span>
                          <Link
                            href={`/book/${c.listing_id}`}
                            className="text-primary hover:underline mr-auto"
                          >
                            فتح الإعلان
                          </Link>
                        </>
                      )
                    })()}
                  </div>
                  <ScrollArea className="flex-1 h-[300px] p-4">
                    <div className="space-y-2">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-lg border bg-background px-3 py-2 text-sm"
                        >
                          <div className="text-[10px] text-muted-foreground mb-1 font-mono">
                            مرسل: {m.sender_id.slice(0, 8)}… ·{" "}
                            {new Date(m.created_at).toLocaleString("ar-JO")}
                          </div>
                          {m.body ? (
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          ) : null}
                          {(m.attachments ?? []).length > 0 ? (
                            <div className={`space-y-2 ${m.body ? "mt-2" : ""}`}>
                              {(m.attachments ?? []).map((att) =>
                                isProbablyImage(att) ? (
                                  <a
                                    key={att.pathname}
                                    href={fileUrl(att.pathname)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block max-w-sm overflow-hidden rounded-md border"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={fileUrl(att.pathname)}
                                      alt={att.name}
                                      className="max-h-40 w-full object-contain bg-muted"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    key={att.pathname}
                                    href={fileUrl(att.pathname)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary underline"
                                  >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    {att.name}
                                  </a>
                                ),
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="border-t px-4 py-2 text-xs text-muted-foreground text-center">
                    وضع مراقبة — قراءة فقط
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
