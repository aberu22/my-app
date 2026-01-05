/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },

  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },

  async rewrites() {
    return [

      // ─────────────────────────────────────────────
    // Stable Diffusion (AUTOMATIC1111)
    // INTERNAL 7860 → PUBLIC /api
    // ─────────────────────────────────────────────
    {
      source: "/api/:path*",
      destination: "http://195.139.22.91:36548/sdapi/v1/:path*",
    },

    
      // ─────────────────────────────────────────────
      // ComfyUI (Wan 2.x) — INTERNAL 8188 → PUBLIC 55743
      // ─────────────────────────────────────────────
      {
        source: "/comfyapi/:path*",
        destination: "http://47.186.29.91:55743/:path*",
      },

      // ─────────────────────────────────────────────
      // Backend API — INTERNAL 8899 → PUBLIC 55073
      // ─────────────────────────────────────────────
      {
        source: "/videoapi/:path*",
        destination: "http://47.186.29.91:55073/videoapi/:path*",
      },

      // ─────────────────────────────────────────────
      // Backend static outputs (videos)
      // ─────────────────────────────────────────────
      {
        source: "/output/:path*",
        destination: "http://47.186.29.91:55073/output/:path*",
      },

      // ─────────────────────────────────────────────
      // LoRAs served by backend
      // ─────────────────────────────────────────────
      {
        source: "/loras/:path*",
        destination: "http://47.186.29.91:55073/loras/:path*",
      },
    ];
  },
};

export default nextConfig;
