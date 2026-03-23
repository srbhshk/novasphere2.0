'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

type ProvidersProps = {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps): React.JSX.Element {
  const [queryClient] = React.useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
