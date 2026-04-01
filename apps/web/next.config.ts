import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    // Keep native/binary optional packages external. These are platform-specific and
    // should be resolved from the runtime environment when present.
    'libsql',
    '@libsql/darwin-arm64',
    '@libsql/darwin-x64',
    '@libsql/linux-x64-gnu',
    '@libsql/linux-x64-musl',
  ],
  // Ensure monorepo workspace packages are traced into standalone output on Vercel.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: [
    '@novasphere/tokens',
    '@novasphere/ui-glass',
    '@novasphere/ui-bento',
    '@novasphere/ui-shell',
    '@novasphere/ui-charts',
    '@novasphere/ui-agent',
    '@novasphere/ui-auth',
    '@novasphere/agent-core',
    '@novasphere/tenant-core',
    '@novasphere/db',
  ],
  turbopack: {},
  devIndicators: false,
}

export default nextConfig
