import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_TO_EMAIL
  if (!apiKey) {
    return NextResponse.json(
      { error: "خدمة البريد غير مُعدّة. يُرجى إضافة RESEND_API_KEY" },
      { status: 503 }
    )
  }
  if (!toEmail) {
    return NextResponse.json(
      { error: "خدمة البريد غير مُعدّة. يُرجى إضافة CONTACT_TO_EMAIL" },
      { status: 503 }
    )
  }

  const resend = new Resend(apiKey)

  try {
    const body = await req.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      )
    }

    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev",
      to: toEmail,
      replyTo: email,
      subject: `رسالة تواصل: ${subject}`,
      text: `الاسم: ${name}
البريد الإلكتروني: ${email}

الرسالة:
${message}`,
    })

    if (error) {
      return NextResponse.json(
        { error: "فشل إرسال الرسالة", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "خطأ داخلي في الخادم" },
      { status: 500 }
    )
  }
}