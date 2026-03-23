import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { GlassPanel } from '../GlassPanel/GlassPanel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import './GlassModal.module.css'

export type GlassModalSize = 'sm' | 'md' | 'lg'

export type GlassModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  size?: GlassModalSize
  children: ReactNode
}

export function GlassModal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  size = 'md',
  children,
}: GlassModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div
        className="ns-glass-modal-backdrop"
        data-testid="glass-backdrop"
        onClick={() => onOpenChange(false)}
      />
      <DialogContent className={cn('ns-glass-modal-content', `ns-glass-modal-${size}`)}>
        <GlassPanel variant="strong">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="ns-glass-modal-body">{children}</div>
          {footer ? <div className="ns-glass-modal-footer">{footer}</div> : null}
        </GlassPanel>
      </DialogContent>
    </Dialog>
  )
}
