/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  async redirects() {
    return [
      {
        source: '/app',
        destination: 'https://app.axs360.com',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
