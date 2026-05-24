import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  trailing?: ReactNode
}

export default function PageHeader({ title, subtitle, trailing }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl lg:text-3xl leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}
