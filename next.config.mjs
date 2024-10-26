/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "mgbhkxfrctnynqmeljum.supabase.co",
        protocol: "https", // 确保使用 HTTPS 协议
      },
    ],
  },
};

export default nextConfig;
