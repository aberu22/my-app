/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://jijcej1a7gw3fy-3000.proxy.runpod.net/sdapi/v1/:path*",
      },
      {
        source: "/comfyapi/:path*",
        destination: "https://kvlgksxwjlt202-8188.proxy.runpod.net/:path*",
      },
      {
        // keep /videoapi calls going to your FastAPI backend
        source: "/videoapi/:path*",
        destination: "https://kvlgksxwjlt202-8899.proxy.runpod.net/videoapi/:path*",
      },
      {
        source: "/output/:path*",
        destination: "https://kvlgksxwjlt202-8899.proxy.runpod.net/output/:path*",
      },
      {
        // 👇 NEW: proxy thumbnails served by FastAPI's `app.mount("/loras", ...)`
        source: "/loras/:path*",
        destination: "https://kvlgksxwjlt202-8899.proxy.runpod.net/loras/:path*",
      },
    ];
  },
};

export default nextConfig;
