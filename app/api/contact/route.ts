import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
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
      to: process.env.CONTACT_TO_EMAIL || "support@unibookclub.com",
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
  } catch (err) {
    return NextResponse.json(
      { error: "خطأ داخلي في الخادم" },
      { status: 500 }
    )
  }
}