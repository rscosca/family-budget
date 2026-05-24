import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import CategoryDonut from '../components/CategoryDonut'
import ExpenseRow from '../components/ExpenseRow'
import { useAuth } from '../context/AuthContext'
import { listCategories, listExpenses } from '../lib/expenses'
import type { Category, Expense } from '../lib/types'
import { endOfMonth, formatDayLabel, formatEur, formatMonth, isoDate, startOfMonth, startOfWeek } from '../lib/format'

type Period = 'day' | 'week' | 'month'

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
}

function periodRange(period: Period, today: Date): { from: string; to: string } {
  if (period === 'day') return { from: isoDate(today), to: isoDate(today) }
  if (period === 'week') return { from: isoDate(startOfWeek(today)), to: isoDate(today) }
  return { from: isoDate(startOfMonth(today)), to: isoDate(endOfMonth(today)) }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>('month')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const { from, to } = periodRange(period, today)

    Promise.all([listExpenses({ from, to, per_page: 200 }), listCategories()])
      .then(([page, cats]) => {
        if (cancelled) return
        setExpenses(page.data)
        setCategories(cats)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'No se pudo cargar el dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [period, today])

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount_cents, 0),
    [expenses],
  )

  const segments = useMemo(() => {
    const byCat = new Map<number, number>()
    for (const e of expenses) {
      byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + e.amount_cents)
    }
    return categories
      .filter((c) => byCat.has(c.id))
      .map((c) => ({ category: c, totalCents: byCat.get(c.id) ?? 0 }))
  }, [expenses, categories])

  const latest = expenses.slice(0, 5)

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.name ?? ''}`}
        subtitle={formatMonth(isoDate(today))}
        trailing={
          <div className="w-11 h-11 rounded-full bg-border flex items-center justify-center font-display font-bold text-accent text-lg">
            {user?.avatar_initials}
          </div>
        }
      />

      <div className="flex gap-2 mb-5">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-[var(--radius-pill)] text-sm font-medium transition ${
              period === p
                ? 'bg-accent text-accent-fg'
                : 'bg-surface border border-border text-muted hover:text-fg'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-btn)] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <section className="bg-surface border border-border rounded-[var(--radius-card)] p-5 mb-6">
        <div className="text-base font-semibold mb-4">Gastos por categoría</div>
        {loading ? (
          <div className="text-muted text-sm py-12 text-center">Cargando…</div>
        ) : (
          <>
            <CategoryDonut segments={segments} totalCents={total} />
            <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
              <span className="text-muted text-sm">Gasto total</span>
              <span className="font-display font-bold text-2xl">{formatEur(total)}</span>
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-xl mb-3">Últimos movimientos</h2>
        {loading && <div className="text-muted text-sm py-4">Cargando…</div>}
        {!loading && latest.length === 0 && (
          <div className="text-muted text-sm py-4">No hay gastos en este periodo.</div>
        )}
        <ul className="divide-y divide-border">
          {latest.map((e) => (
            <li key={e.id}>
              <ExpenseRow expense={e} subline={formatDayLabel(e.occurred_on, today)} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
