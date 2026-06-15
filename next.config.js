/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. This is acceptable for prototypes
    // but should be turned off for production-quality code.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig