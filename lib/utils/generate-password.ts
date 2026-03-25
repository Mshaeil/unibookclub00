/** Cryptographically strong random password (mixed classes, shuffled). */
export function generateStrongPassword(length = 18): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghijkmnopqrstuvwxyz"
  const nums = "23456789"
  const sym = "!@#$%&*-_=+"
  const all = upper + lower + nums + sym
  const minLen = Math.max(length, 12)
  const buf = new Uint32Array(minLen)
  crypto.getRandomValues(buf)

  const chars: string[] = []
  chars.push(upper[buf[0]! % upper.length])
  chars.push(lower[buf[1]! % lower.length])
  chars.push(nums[buf[2]! % nums.length])
  chars.push(sym[buf[3]! % sym.length])

  for (let i = 4; i < minLen; i++) {
    chars.push(all[buf[i]! % all.length])
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = buf[i % buf.length]! % (i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }

  return chars.join("")
}

export const PASSWORD_MIN_LENGTH = 8

export function isPasswordStrongEnough(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) return false
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  return hasLower && hasUpper && hasDigit && hasSymbol
}
