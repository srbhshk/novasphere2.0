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
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /packages\/db\/dist\/index\.(js|cjs)/,
        message:
          /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ]

    return config
  },
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
