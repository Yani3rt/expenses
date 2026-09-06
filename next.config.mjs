import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  distDir: process.env.EXPENSE_NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
};

export default nextConfig;
