/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизация для Vercel
  output: 'standalone',
  
  // Включение React Strict Mode в разработке
  reactStrictMode: true,
  
  // Настройка компиляции SWC для лучшей производительности
  swcMinify: true,
  
  // Настройка изображений
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ecopolyana.vercel.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.openstreetmap.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.arcgisonline.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.a.ssl.fastly.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.basemaps.cartocdn.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Настройка заголовков безопасности
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
  
  // Настройка редиректов (опционально)
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Настройка rewrites для API (если понадобится)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Webpack кастомизация для Leaflet
  webpack: (config, { isServer, dev }) => {
    // Исправление для иконок Leaflet в SSR/сборке
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        leaflet$: 'leaflet/dist/leaflet-src.esm.js',
      };
    }
    
    // Оптимизация для продакшена
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          leaflet: {
            test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
            name: 'leaflet',
            priority: 10,
            reuseExistingChunk: true,
          },
          frameworks: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'frameworks',
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Экспериментальные фичи (опционально, для Next.js 14+)
  experimental: {
    // optimizeCss: true,
    // scrollRestoration: true,
  },
  
  // Настройка environment variables для клиента
  env: {
    NEXT_PUBLIC_APP_NAME: 'Экополяна',
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000',
  },
};

export default nextConfig;
