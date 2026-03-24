import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import * as React from 'react'

import { novaConfig } from '../../../../nova.config'
import {
  isValidThemePreset,
  normalizeThemePreset,
  THEME_COOKIE_NAME,
} from '@/lib/theme-presets'
import Providers from './providers'
import '@/styles/globals.css'
import { Exo_2, Space_Grotesk } from 'next/font/google'

const exo2 = Exo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-exo-2',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: novaConfig.product.name,
  description: novaConfig.product.description,
}

type RootLayoutProps = {
  children: React.ReactNode
}

function resolveThemePreset(): string {
  const theme = novaConfig.theme
  if ('preset' in theme && typeof theme.preset === 'string') {
    return isValidThemePreset(theme.preset)
      ? normalizeThemePreset(theme.preset)
      : 'nova-dark'
  }
  return 'nova-dark'
}

export default async function RootLayout({
  children,
}: RootLayoutProps): Promise<React.JSX.Element> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(THEME_COOKIE_NAME)?.value
  const decoded = fromCookie != null ? decodeURIComponent(fromCookie) : null
  const themePreset = isValidThemePreset(decoded)
    ? normalizeThemePreset(decoded)
    : resolveThemePreset()

  return (
    <html lang="en" data-theme={themePreset}>
      <body className={`${exo2.variable} ${spaceGrotesk.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
