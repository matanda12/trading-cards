import { type LucideIcon } from 'lucide-react'

type Props = {
  icon?: LucideIcon
  emoji?: string
  title: string
  description?: string
  children?: React.ReactNode
}

export function EmptyState({ icon: Icon, emoji, title, description, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-border/30 bg-card/20 text-center">
      {Icon ? (
        <Icon size={52} className="text-muted-foreground/30 mb-4" strokeWidth={1.5} />
      ) : emoji ? (
        <p className="text-5xl mb-4">{emoji}</p>
      ) : null}
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
