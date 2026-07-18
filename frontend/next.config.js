/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react", "recharts"],
  },
};
module.exports = nextConfig;
