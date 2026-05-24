import type { Category } from '../lib/types'
import { formatEur } from '../lib/format'

type Segment = {
  category: Category
  totalCents: number
}

type Props = {
  segments: Segment[]
  totalCents: number
}

const SIZE = 180
const STROKE = 22
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function CategoryDonut({ segments, totalCents }: Props) {
  const sortedSegments = [...segments].sort((a, b) => b.totalCents - a.totalCents)

  let cumulative = 0
  const arcs = sortedSegments.map((seg) => {
    const fraction = totalCents > 0 ? seg.totalCents / totalCents : 0
    const length = fraction * CIRCUMFERENCE
    const offset = -cumulative * CIRCUMFERENCE
    cumulative += fraction
    return { ...seg, length, offset }
  })

  return (
    <div className="flex items-center gap-5">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
        />
        {totalCents > 0 &&
          arcs.map(({ category, length, offset }) => (
            <circle
              key={category.id}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={category.color}
              strokeWidth={STROKE}
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ))}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display font-bold fill-fg"
          style={{ fontSize: 22 }}
        >
          {formatEur(totalCents)}
        </text>
      </svg>

      <ul className="flex-1 flex flex-col gap-2 text-sm min-w-0">
        {sortedSegments.length === 0 && (
          <li className="text-muted text-xs">Sin gastos en este periodo.</li>
        )}
        {sortedSegments.map((seg) => (
          <li key={seg.category.id} className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.category.color }}
            />
            <span className="text-muted flex-1 truncate">{seg.category.name}</span>
            <span className="font-mono text-fg">{formatEur(seg.totalCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
