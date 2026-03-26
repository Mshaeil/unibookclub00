/** @type {import('next').NextConfig} */
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
    ]
  },
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
}

export default nextConfig
