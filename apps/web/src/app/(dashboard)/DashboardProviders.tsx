'use client'

import * as React from 'react'

import { CopilotChatProvider } from './CopilotContext'

export default function DashboardProviders({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return <CopilotChatProvider>{children}</CopilotChatProvider>
}
