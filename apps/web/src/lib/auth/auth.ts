import { accounts, sessions, users, verifications } from '@novasphere/db'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { betterAuth } from 'better-auth'
import {
  admin,
  bearer,
  createAccessControl,
  organization,
  role,
} from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'

const accessControl = createAccessControl({
  dashboard: ['read', 'compose', 'manage'],
  settings: ['read', 'write'],
})

const adminRole = role({
  dashboard: ['read', 'compose', 'manage'],
  settings: ['read', 'write'],
})

const memberRole = role({
  dashboard: ['read', 'compose'],
  settings: ['read'],
})

function requiredEnv(
  name: 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL' | 'NEXT_PUBLIC_APP_URL',
): string {
  const value = process.env[name]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export async function createAuth() {
  const betterAuthUrl = requiredEnv('BETTER_AUTH_URL')
  const betterAuthSecret = requiredEnv('BETTER_AUTH_SECRET')
  const appUrl = requiredEnv('NEXT_PUBLIC_APP_URL')
  const githubClientId = process.env['GITHUB_CLIENT_ID']
  const githubClientSecret = process.env['GITHUB_CLIENT_SECRET']
  const googleClientId = process.env['GOOGLE_CLIENT_ID']
  const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET']
  const databaseAdapter = await resolveDatabaseAdapter()

  return betterAuth({
    appName: 'novasphere',
    baseURL: betterAuthUrl,
    secret: betterAuthSecret,
    trustedOrigins: [appUrl],
    database: databaseAdapter,
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'viewer',
        },
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      ...(githubClientId != null && githubClientSecret != null
        ? {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          }
        : {}),
      ...(googleClientId != null && googleClientSecret != null
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : {}),
    },
    plugins: [
      nextCookies(),
      organization({
        ac: accessControl,
        roles: {
          admin: adminRole,
          member: memberRole,
        },
      }),
      admin({
        ac: accessControl,
        roles: {
          admin: adminRole,
          viewer: memberRole,
        },
      }),
      bearer(),
    ],
  })
}

async function resolveDatabaseAdapter() {
  try {
    type DrizzleDb = Parameters<typeof drizzleAdapter>[0]
    const loadModule = new Function('specifier', 'return import(specifier)') as (
      specifier: string,
    ) => Promise<{ getDb: () => unknown }>
    const { getDb } = await loadModule('@novasphere/db')
    const runtimeDb = getDb()
    // Safe: @novasphere/db exports Drizzle database instance via getDb().
    return drizzleAdapter(runtimeDb as DrizzleDb, {
      provider: 'sqlite',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    })
  } catch {
    // Build/runtime fallback when DB driver modules are unavailable.
    return memoryAdapter({})
  }
}
