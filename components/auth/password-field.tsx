"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, Sparkles } from "lucide-react"
import { generateStrongPassword } from "@/lib/utils/generate-password"

type Props = {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  /** Show "generate strong password" (register / reset) */
  showGenerate?: boolean
  generateLabel?: string
  showPasswordAria: string
  hidePasswordAria: string
  autoComplete?: string
}

export function PasswordField({
  id: propId,
  label,
  value,
  onChange,
  disabled,
  placeholder = "••••••••",
  showGenerate,
  generateLabel = "",
  showPasswordAria,
  hidePasswordAria,
  autoComplete = "new-password",
}: Props) {
  const uid = useId()
  const id = propId ?? uid
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      {(label || showGenerate) && (
        <div
          className={`flex flex-wrap items-center gap-2 ${label ? "justify-between" : "justify-end"}`}
        >
          {label ? <Label htmlFor={id}>{label}</Label> : null}
          {showGenerate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={disabled}
              onClick={() => onChange(generateStrongPassword(18))}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generateLabel}
            </Button>
          )}
        </div>
      )}
      <div className="relative flex items-center">
        <Lock className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ps-10 pe-12"
          placeholder={placeholder}
          required
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 h-8 w-8 -translate-y-1/2 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hidePasswordAria : showPasswordAria}
          disabled={disabled}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
