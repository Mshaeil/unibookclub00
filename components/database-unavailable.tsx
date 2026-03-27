 "use client"

import Link from "next/link"

type Props = {
  title?: string
  message?: string
  retryPath?: string
}

export function DatabaseUnavailable({
  title = "تعذر تحميل البيانات حالياً",
  message = "يبدو أن الاتصال بقاعدة البيانات بطيء أو منقطع مؤقتاً. أعد المحاولة بعد لحظات.",
  retryPath,
}: Props) {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border px-4 text-sm"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </button>
          {retryPath ? (
            <Link href={retryPath} className="inline-flex h-9 items-center rounded-md border px-4 text-sm">
              فتح الصفحة مجدداً
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

