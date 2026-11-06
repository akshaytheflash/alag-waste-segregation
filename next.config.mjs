/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    // Keep the native better-sqlite3 binding out of the webpack bundle so
    // Vercel's Node runtime loads the prebuilt binary at runtime.
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};
export default nextConfig;
