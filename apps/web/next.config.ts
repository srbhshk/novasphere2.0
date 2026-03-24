import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    '@libsql/client',
    'libsql',
    '@libsql/darwin-arm64',
    '@libsql/darwin-x64',
    '@neondatabase/serverless',
    'pg',
  ],
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
  ],
  turbopack: {},
  devIndicators: false,
}

export default nextConfig
