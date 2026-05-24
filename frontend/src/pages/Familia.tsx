import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ExpenseRow from '../components/ExpenseRow'
import { listExpenses, listFamilyMembers } from '../lib/expenses'
import type { Expense, FamilyMember } from '../lib/types'
import { endOfMonth, formatEur, formatMonth, isoDate, startOfMonth } from '../lib/format'
import { getIcon } from '../lib/icons'

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export default function Familia() {
  const today = useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()))
  const isCurrentMonth = isSameMonth(viewMonth, today)

  const [members, setMembers] = useState<FamilyMember[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      listFamilyMembers(),
      listExpenses({
        from: isoDate(startOfMonth(viewMonth)),
        to: isoDate(endOfMonth(viewMonth)),
        per_page: 200,
      }),
    ])
      .then(([ms, page]) => {
        if (cancelled) return
        setMembers(ms)
        setExpenses(page.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'No se pudo cargar Familia.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewMonth])

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount_cents, 0),
    [expenses],
  )

  const rows = useMemo(() => {
    const byId = new Map<number, Expense[]>()
    for (const e of expenses) {
      const list = byId.get(e.family_member_id) ?? []
      list.push(e)
      byId.set(e.family_member_id, list)
    }
    return members
      .map((m) => {
        const list = byId.get(m.id) ?? []
        const memberTotal = list.reduce((sum, e) => sum + e.amount_cents, 0)
        return { member: m, total: memberTotal, expenses: list }
      })
      .sort((a, b) => b.total - a.total)
  }, [members, expenses])

  return (
    <>
      <PageHeader title="Familia" subtitle="Gastos por miembro" />

      <div className="flex items-center justify-between bg-surface border border-border rounded-[var(--radius-pill)] px-2 py-1.5 mb-5">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          aria-label="Mes anterior"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-white/5 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-display font-semibold text-sm">
            {formatMonth(isoDate(viewMonth))}
          </span>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setViewMonth(startOfMonth(new Date()))}
              className="text-[10px] uppercase tracking-wider text-accent hover:underline"
            >
              Hoy
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Mes siguiente"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-white/5 transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-btn)] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <section className="bg-surface border border-border rounded-[var(--radius-card)] p-5 mb-5">
        <div className="text-xs text-muted mb-1">
          Total {formatMonth(isoDate(viewMonth)).split(' ')[0]}
        </div>
        <div className="font-display font-bold text-3xl text-accent leading-tight">
          {formatEur(total)}
        </div>
        <div className="text-xs text-muted mt-1">
          {expenses.length} gastos · {members.length} miembros
        </div>
      </section>

      {loading && <div className="text-muted text-sm py-4">Cargando…</div>}
      {!loading && rows.length === 0 && (
        <div className="text-muted text-sm py-4">No hay miembros configurados.</div>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map(({ member, total: memberTotal, expenses: memberExpenses }) => {
          const Icon = getIcon(member.icon)
          const pct = total > 0 ? (memberTotal / total) * 100 : 0
          const isExpanded = expandedId === member.id
          const hasExpenses = memberExpenses.length > 0
          return (
            <li
              key={member.id}
              className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => hasExpenses && setExpandedId(isExpanded ? null : member.id)}
                disabled={!hasExpenses}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition disabled:cursor-default disabled:hover:bg-transparent"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${member.color}26`, color: member.color }}
                >
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display font-semibold truncate">{member.name}</span>
                    <span className="font-mono font-medium shrink-0">
                      {formatEur(memberTotal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${pct}%`, backgroundColor: member.color }}
                      />
                    </div>
                    <span className="text-xs text-muted shrink-0 tabular-nums w-9 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {memberExpenses.length} {memberExpenses.length === 1 ? 'gasto' : 'gastos'}
                  </div>
                </div>
                {hasExpenses && (
                  <ChevronDown
                    size={18}
                    className={`text-muted shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
              {isExpanded && hasExpenses && (
                <div className="border-t border-border px-4">
                  <ul className="divide-y divide-border">
                    {memberExpenses.slice(0, 10).map((e) => (
                      <li key={e.id}>
                        <ExpenseRow expense={e} />
                      </li>
                    ))}
                  </ul>
                  {memberExpenses.length > 10 && (
                    <div className="pt-2 pb-3 text-xs text-muted text-center">
                      Y {memberExpenses.length - 10} más…
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
