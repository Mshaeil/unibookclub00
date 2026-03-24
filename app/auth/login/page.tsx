"use client"

import { Suspense } from "react"
import LoginForm from "./login-form"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">جاري التحميل...</div>}>
      <LoginForm />
    </Suspense>
  )
}