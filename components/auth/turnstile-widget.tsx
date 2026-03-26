"use client"

import { useEffect, useId, useState } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

type Props = {
  siteKey: string
  onToken: (token: string) => void
  onError?: () => void
}

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load Turnstile script"))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export function TurnstileWidget({ siteKey, onToken, onError }: Props) {
  const containerId = useId().replace(/:/g, "_")
  const [widgetId, setWidgetId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        await loadTurnstileScript()
        if (!mounted) return
        if (!window.turnstile) throw new Error("Turnstile not available")
        const id = window.turnstile.render(`#${containerId}`, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "error-callback": () => onError?.(),
          "expired-callback": () => onToken(""),
        })
        setWidgetId(id)
      } catch {
        onError?.()
      }
    })()
    return () => {
      mounted = false
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.reset(widgetId)
        } catch {
          // ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  return <div id={containerId} />
}

