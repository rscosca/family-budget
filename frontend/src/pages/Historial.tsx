import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ExpenseRow from '../components/ExpenseRow'
import FilterSheet from '../components/FilterSheet'
import { listCategories, listExpenses, listFamilyMembers } from '../lib/expenses'
import type { Category, Expense, FamilyMember } from '../lib/types'
import { endOfMonth, formatDayLabel, formatEur, formatMonth, isoDate, startOfMonth } from '../lib/format'

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function applyFilters(
  expenses: Expense[],
  categoryIds: number[],
  memberIds: number[],
): Expense[] {
  if (categoryIds.length === 0 && memberIds.length === 0) return expenses
  return expenses.filter((e) => {
    if (categoryIds.length > 0 && !categoryIds.includes(e.category_id)) return false
    if (memberIds.length > 0 && !memberIds.includes(e.family_member_id)) return false
    return true
  })
}

export default function Historial() {
  const today = useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()))
  const previousMonthStart = useMemo(() => addMonths(viewMonth, -1), [viewMonth])

  const isCurrentMonth = isSameMonth(viewMonth, today)
  const isFutureMonth = viewMonth > startOfMonth(today)

  const [current, setCurrent] = useState<Expense[]>([])
  const [previous, setPrevious] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([listCategories(), listFamilyMembers()])
      .then(([cats, ms]) => {
        if (cancelled) return
        setCategories(cats)
        setMembers(ms)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      listExpenses({
        from: isoDate(startOfMonth(viewMonth)),
        to: isoDate(endOfMonth(viewMonth)),
        per_page: 200,
      }),
      listExpenses({
        from: isoDate(startOfMonth(previousMonthStart)),
        to: isoDate(endOfMonth(previousMonthStart)),
        per_page: 200,
      }),
    ])
      .then(([currentPage, previousPage]) => {
        if (cancelled) return
        setCurrent(currentPage.data)
        setPrevious(previousPage.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'No se pudo cargar el historial.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewMonth, previousMonthStart])

  const currentFiltered = useMemo(
    () => applyFilters(current, selectedCategoryIds, selectedMemberIds),
    [current, selectedCategoryIds, selectedMemberIds],
  )
  const previousFiltered = useMemo(
    () => applyFilters(previous, selectedCategoryIds, selectedMemberIds),
    [previous, selectedCategoryIds, selectedMemberIds],
  )

  const totalCurrent = useMemo(
    () => currentFiltered.reduce((sum, e) => sum + e.amount_cents, 0),
    [currentFiltered],
  )
  const totalPrevious = useMemo(
    () => previousFiltered.reduce((sum, e) => sum + e.amount_cents, 0),
    [previousFiltered],
  )

  const daysInMonth = endOfMonth(viewMonth).getDate()
  const daysElapsed = isCurrentMonth ? today.getDate() : isFutureMonth ? 0 : daysInMonth
  const dailyAverageCents = daysElapsed > 0 ? Math.round(totalCurrent / daysElapsed) : 0

  const pctDiff =
    totalPrevious > 0 ? Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100) : null

  const filtered = useMemo(() => {
    if (!search.trim()) return currentFiltered
    const q = search.trim().toLowerCase()
    return currentFiltered.filter((e) => (e.description ?? '').toLowerCase().includes(q))
  }, [currentFiltered, search])

  const groupedByDay = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const e of filtered) {
      const list = map.get(e.occurred_on) ?? []
      list.push(e)
      map.set(e.occurred_on, list)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [filtered])

  const activeFilterCount = selectedCategoryIds.length + selectedMemberIds.length

  const toggleCategory = (id: number) =>
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  const toggleMember = (id: number) =>
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  const clearFilters = () => {
    setSelectedCategoryIds([])
    setSelectedMemberIds([])
  }

  return (
    <>
      <PageHeader
        title="Historial"
        trailing={
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative flex items-center gap-2 bg-surface border border-border rounded-[var(--radius-pill)] px-4 py-2 text-sm text-muted hover:text-fg transition"
          >
            <SlidersHorizontal size={16} />
            Filtrar
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-fg text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        }
      />

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

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4">
          <div className="text-xs text-muted mb-1">
            {isFutureMonth ? 'Previsto' : 'Total'} {formatMonth(isoDate(viewMonth)).split(' ')[0]}
          </div>
          <div className="font-display font-bold text-2xl text-accent leading-tight">
            {formatEur(totalCurrent)}
          </div>
          <div className="text-xs text-muted mt-1">
            {currentFiltered.length} gastos
            {activeFilterCount > 0 && ` · de ${current.length}`}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4">
          <div className="text-xs text-muted mb-1">
            {isFutureMonth ? 'Media mensual' : 'Promedio diario'}
          </div>
          <div className="font-display font-bold text-2xl leading-tight">
            {isFutureMonth
              ? formatEur(daysInMonth > 0 ? Math.round(totalCurrent / daysInMonth) : 0)
              : formatEur(dailyAverageCents)}
          </div>
          {pctDiff !== null && (
            <div className={`text-xs mt-1 ${pctDiff >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {pctDiff >= 0 ? '+' : ''}
              {pctDiff}% vs {formatMonth(isoDate(previousMonthStart)).split(' ')[0]}
            </div>
          )}
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar movimiento…"
          className="w-full bg-surface border border-border rounded-[var(--radius-pill)] pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent transition"
        />
      </div>

      {loading && <div className="text-muted text-sm py-4">Cargando…</div>}
      {!loading && groupedByDay.length === 0 && (
        <div className="text-muted text-sm py-4">No hay gastos para mostrar.</div>
      )}

      <div className="flex flex-col gap-6">
        {groupedByDay.map(([day, items]) => {
          const dayTotal = items.reduce((sum, e) => sum + e.amount_cents, 0)
          return (
            <section key={day}>
              <div className="flex items-baseline justify-between border-b border-border pb-2 mb-1">
                <h3 className="font-display font-bold text-sm">{formatDayLabel(day, today)}</h3>
                <span className="font-mono text-sm text-muted">−{formatEur(dayTotal)}</span>
              </div>
              <ul className="divide-y divide-border">
                {items.map((e) => (
                  <li key={e.id}>
                    <ExpenseRow expense={e} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        members={members}
        selectedCategoryIds={selectedCategoryIds}
        selectedMemberIds={selectedMemberIds}
        onToggleCategory={toggleCategory}
        onToggleMember={toggleMember}
        onClear={clearFilters}
      />
    </>
  )
}
