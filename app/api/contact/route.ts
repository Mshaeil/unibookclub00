import { NextResponse } from "next/server"
import { Resend } from "resend"
import { isValidEmailFormat, normalizeEmail } from "@/lib/utils/email"
import { rateLimit } from "@/lib/utils/rate-limit"
import { verifyTurnstileToken } from "@/lib/utils/turnstile"

const MAX_NAME = 120
const MAX_SUBJECT = 200
const MAX_MESSAGE = 5000

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0]?.trim() || "unknown"
  return req.headers.get("x-real-ip")?.trim() || "unknown"
}

export async function POST(req: Request) {
  const ip = clientIp(req)
  const limited = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 })
  if (!limited.ok) {
    return NextResponse.json(
      { error: "طلبات كثيرة. حاول لاحقاً." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_TO_EMAIL
  if (!apiKey) {
    return NextResponse.json(
      { error: "خدمة البريد غير مُعدّة. يُرجى إضافة RESEND_API_KEY" },
      { status: 503 },
    )
  }
  if (!toEmail) {
    return NextResponse.json(
      { error: "خدمة البريد غير مُعدّة. يُرجى إضافة CONTACT_TO_EMAIL" },
      { status: 503 },
    )
  }

  try {
    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const message = typeof body.message === "string" ? body.message.trim() : ""
    const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : ""

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }
    if (name.length > MAX_NAME || subject.length > MAX_SUBJECT || message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: "أحد الحقول أطول من المسموح" }, { status: 400 })
    }
    if (!isValidEmailFormat(email)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 })
    }

    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
    if (turnstileSiteKey) {
      const ok = await verifyTurnstileToken(captchaToken, ip)
      if (!ok) {
        return NextResponse.json({ error: "فشل التحقق الأمني. أعد المحاولة." }, { status: 400 })
      }
    }

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev",
      to: toEmail,
      replyTo: normalizeEmail(email),
      subject: `رسالة تواصل: ${subject}`,
      text: `الاسم: ${name}
البريد الإلكتروني: ${email}

الرسالة:
${message}`,
    })

    if (error) {
      return NextResponse.json({ error: "فشل إرسال الرسالة" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "خطأ داخلي في الخادم" }, { status: 500 })
  }
}
