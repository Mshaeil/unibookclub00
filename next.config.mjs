/** @type {import('next').NextConfig} */
function supabaseImageRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) return []
  try {
    const u = new URL(raw)
    const protocol = u.protocol === 'http:' ? 'http' : 'https'
    const pattern = {
      protocol,
      hostname: u.hostname,
      pathname: '/storage/v1/object/**',
    }
    if (u.port) {
      pattern.port = u.port
    }
    return [pattern]
  } catch {
    return []
  }
}

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/messages',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/messages/:path*',
        destination: '/dashboard',
        permanent: false,
      },
      { source: '/auth/login', destination: '/login', permanent: true },
      { source: '/auth/register', destination: '/register', permanent: true },
      { source: '/auth/forgot-password', destination: '/forgot-password', permanent: true },
      { source: '/auth/reset-password', destination: '/reset-password', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  poweredByHeader: false,
  images: {
    /** تحسين الصور عبر Next (أخف على الشبكة). */
    unoptimized: false,
    remotePatterns: supabaseImageRemotePatterns(),
    /** مطلوب في Next 16 لـ <Image src="/api/file?pathname=..." /> */
    localPatterns: [{ pathname: '/api/file' }],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    /** Native View Transitions where supported — smoother route morphs */
    viewTransition: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
}

export default nextConfig
