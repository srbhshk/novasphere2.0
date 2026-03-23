import { AlertCircle, LayoutGrid } from 'lucide-react'
import { GlassCard } from '@novasphere/ui-glass'

export type BentoPlaceholderProps = {
  moduleId: string
}

export function BentoPlaceholder({ moduleId }: BentoPlaceholderProps) {
  return (
    <GlassCard
      variant="subtle"
      className="flex h-full flex-col items-start justify-center gap-2"
    >
      <div className="inline-flex items-center gap-2 text-[color:var(--ns-color-warning)]">
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">Module not found</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-[color:var(--ns-color-muted)]">
        <AlertCircle className="mt-px h-3 w-3" aria-hidden="true" />
        <span>{moduleId}</span>
      </div>
    </GlassCard>
  )
}
