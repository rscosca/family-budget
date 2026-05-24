import { Link } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import type { Expense } from '../lib/types'
import { formatEur } from '../lib/format'
import { getIcon } from '../lib/icons'

type Props = {
  expense: Expense
  subline?: string
}

export default function ExpenseRow({ expense, subline }: Props) {
  const category = expense.category
  const Icon = category ? getIcon(category.icon) : getIcon('user')
  const color = category?.color ?? '#9CA3AF'
  const isRecurring = expense.recurring_expense_id !== null

  return (
    <Link
      to={`/gasto/${expense.id}`}
      className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-[var(--radius-btn)] hover:bg-white/5 active:bg-white/10 transition"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}26`, color }}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate flex items-center gap-1.5">
          {isRecurring && (
            <span
              className="text-muted shrink-0"
              aria-label="Gasto recurrente"
              title="Gasto recurrente"
            >
              <Repeat size={13} />
            </span>
          )}
          <span className="truncate">
            {expense.description ?? category?.name ?? 'Gasto'}
          </span>
        </div>
        <div className="text-xs text-muted truncate">
          {subline ?? category?.name ?? ''}
        </div>
      </div>
      <div className="font-mono font-medium shrink-0">
        −{formatEur(expense.amount_cents)}
      </div>
    </Link>
  )
}
