import { z } from 'zod'

const serverSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().min(1).default('qwen2.5:0.5b'),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RATE_LIMIT_AGENT_RPM: z.coerce.number().int().positive().default(20),
})

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_DATA_SOURCE: z.enum(['mock', 'api']).default('mock'),
})

const envSchema = serverSchema.merge(clientSchema)

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment variables:\n${issues}`)
}

export const env = parsedEnv.data

export const {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  DATABASE_URL,
  ANTHROPIC_API_KEY,
  OPENAI_API_KEY,
  RATE_LIMIT_AGENT_RPM,
  NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DATA_SOURCE,
} = env
