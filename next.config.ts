import type { NextConfig } from "next";
// Static export so the same build works on Vercel, as a PWA, and inside Capacitor (iOS/Android).
const nextConfig: NextConfig = { output: "export", images: { unoptimized: true }, trailingSlash: true };
export default nextConfig;
