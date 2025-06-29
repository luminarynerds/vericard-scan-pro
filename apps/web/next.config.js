/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  eslint: {
    // Disable ESLint during builds - Linus doesn't need a linter
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig