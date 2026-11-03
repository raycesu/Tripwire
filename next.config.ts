import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  turbopack: {
    // Pin root to this app so Turbopack ignores parent lockfiles
    // (e.g. ~/pnpm-lock.yaml) that cause macOS Desktop permission panics.
    root: path.join(__dirname),
  },
}

export default nextConfig
