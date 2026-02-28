/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        port: '',
        pathname: '/prompt/**',
      },
      {
        protocol: 'https',
        hostname: 'pollinations.ai',
        port: '',
        pathname: '/p/**',
      },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' https: blob: data:; font-src 'self'; connect-src 'self' https://image.pollinations.ai https://pollinations.ai;"
          },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
