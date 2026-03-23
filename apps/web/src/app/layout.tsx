import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import * as React from 'react'

import { novaConfig } from '../../../../nova.config'
import { isValidThemePreset, THEME_COOKIE_NAME } from '@/lib/theme-presets'
import Providers from './providers'
import '@/styles/globals.css'

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
    return theme.preset
  }
  return 'midnight-bloom'
}

export default async function RootLayout({
  children,
}: RootLayoutProps): Promise<React.JSX.Element> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(THEME_COOKIE_NAME)?.value
  const decoded = fromCookie != null ? decodeURIComponent(fromCookie) : null
  const themePreset = isValidThemePreset(decoded) ? decoded : resolveThemePreset()

  return (
    <html lang="en" data-theme={themePreset}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
