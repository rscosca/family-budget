import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ChevronDown, Repeat, Trash2 } from 'lucide-react'
import { listCategories, listFamilyMembers, type ExpenseInput } from '../lib/expenses'
import type { Category, FamilyMember } from '../lib/types'
import { ApiError } from '../lib/api'
import { getIcon } from '../lib/icons'
import { isoDate } from '../lib/format'

type InitialValues = Partial<{
  amount_cents: number
  description: string | null
  category_id: number
  family_member_id: number
  occurred_on: string
}>

type Props = {
  initialValues?: InitialValues
  submitLabel: string
  onSubmit: (input: ExpenseInput) => Promise<void>
  onDelete?: () => Promise<void>
  allowRecurring?: boolean
}

function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

function parseAmountToCents(input: string): number | null {
  const normalized = input.replace(',', '.').trim()
  if (!normalized) return null
  const value = Number(normalized)
  if (Number.isNaN(value) || value <= 0) return null
  return Math.round(value * 100)
}

export default function ExpenseForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
  allowRecurring = false,
}: Props) {
  const today = isoDate(new Date())

  const defaultEndsOn = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 11)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [categories, setCategories] = useState<Category[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)

  const [amount, setAmount] = useState(
    initialValues?.amount_cents !== undefined ? centsToAmount(initialValues.amount_cents) : '',
  )
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [categoryId, setCategoryId] = useState<number | null>(initialValues?.category_id ?? null)
  const [memberId, setMemberId] = useState<number | null>(initialValues?.family_member_id ?? null)
  const [date, setDate] = useState(initialValues?.occurred_on ?? today)

  const [isRecurring, setIsRecurring] = useState(false)
  const [endsOnMonth, setEndsOnMonth] = useState(defaultEndsOn)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([listCategories(), listFamilyMembers()])
      .then(([cats, mems]) => {
        setCategories(cats)
        setMembers(mems)
        if (initialValues?.family_member_id === undefined) {
          const familia = mems.find((m) => m.name === 'Familia')
          if (familia) setMemberId(familia.id)
        }
      })
      .catch((err) => setError(err.message ?? 'No se pudieron cargar categorías y miembros.'))
      .finally(() => setLoadingMeta(false))
  }, [initialValues?.family_member_id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const cents = parseAmountToCents(amount)
    if (cents === null) {
      setError('Introduce un importe válido.')
      return
    }
    if (!categoryId) {
      setError('Elige una categoría.')
      return
    }
    if (!memberId) {
      setError('Elige un miembro de familia.')
      return
    }

    const payload: ExpenseInput = {
      amount_cents: cents,
      category_id: categoryId,
      family_member_id: memberId,
      description: description.trim() || null,
      occurred_on: date,
    }

    if (allowRecurring && isRecurring) {
      const dayOfMonth = Number(date.slice(8, 10))
      const [endYear, endMonth] = endsOnMonth.split('-').map(Number)
      if (!endYear || !endMonth) {
        setError('Indica un mes y año de fin válidos.')
        return
      }
      const lastDay = new Date(endYear, endMonth, 0).getDate()
      payload.recurring = {
        day_of_month: dayOfMonth,
        ends_on: `${endYear}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      }
    }

    setSubmitting(true)
    try {
      await onSubmit(payload)
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldError = err.errors && Object.values(err.errors)[0]?.[0]
        setError(fieldError ?? err.message)
      } else {
        setError('No se pudo guardar el gasto.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!window.confirm('¿Borrar este gasto?')) return
    setError(null)
    setDeleting(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar el gasto.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-center py-4">
        <label htmlFor="amount" className="text-sm text-muted block mb-2">
          Cantidad
        </label>
        <div className="flex items-baseline justify-center gap-1">
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-44 bg-transparent text-accent font-display font-bold text-5xl text-center focus:outline-none placeholder:text-accent/40"
          />
          <span className="text-accent/60 text-2xl">€</span>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block font-display font-semibold mb-2">
          Descripción
        </label>
        <input
          id="description"
          type="text"
          maxLength={160}
          placeholder="Ej. Compra semanal, Luz, Cine…"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface border border-border rounded-[var(--radius-btn)] px-4 py-3 text-fg focus:outline-none focus:border-accent transition"
        />
      </div>

      <div>
        <label htmlFor="category" className="block font-display font-semibold mb-2">
          Categoría
        </label>
        <div className="relative">
          {(() => {
            const selected = categories.find((c) => c.id === categoryId)
            if (!selected) return null
            const Icon = getIcon(selected.icon)
            return (
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${selected.color}26`, color: selected.color }}
              >
                <Icon size={16} />
              </span>
            )
          })()}
          <select
            id="category"
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className={`w-full appearance-none bg-surface border border-border rounded-[var(--radius-btn)] py-3 pr-10 text-fg focus:outline-none focus:border-accent transition ${
              categoryId ? 'pl-14' : 'pl-4'
            }`}
          >
            <option value="" disabled>
              Selecciona una categoría…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
      </div>

      <div>
        <div className="block font-display font-semibold mb-2">Miembro</div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const active = memberId === m.id
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => setMemberId(m.id)}
                className={`rounded-[var(--radius-pill)] px-4 py-2 text-sm transition ${
                  active ? 'text-fg' : 'text-muted border border-border hover:text-fg'
                }`}
                style={
                  active
                    ? { backgroundColor: `${m.color}33`, borderColor: m.color, borderWidth: 1 }
                    : undefined
                }
              >
                {m.name}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="date" className="block font-display font-semibold mb-2">
          Fecha
        </label>
        <input
          id="date"
          type="date"
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface border border-border rounded-[var(--radius-btn)] px-4 py-3 text-fg focus:outline-none focus:border-accent transition font-mono"
        />
      </div>

      {allowRecurring && (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                <Repeat size={18} />
              </span>
              <span>
                <span className="font-display font-semibold block">Repetir cada mes</span>
                <span className="text-xs text-muted">
                  Genera un gasto mensual con el día de la fecha.
                </span>
              </span>
            </span>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <span className="block w-11 h-6 bg-border rounded-full peer-checked:bg-accent transition" />
              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-fg rounded-full transition peer-checked:translate-x-5" />
            </span>
          </label>

          {isRecurring && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="text-xs text-muted">
                Día del mes:{' '}
                <span className="text-fg font-medium">{Number(date.slice(8, 10))}</span>
                <span className="text-muted/70"> (tomado de la fecha)</span>
              </div>
              <div>
                <label
                  htmlFor="ends_on_month"
                  className="block text-sm font-display font-semibold mb-2"
                >
                  Hasta el mes
                </label>
                <input
                  id="ends_on_month"
                  type="month"
                  min={date.slice(0, 7)}
                  value={endsOnMonth}
                  onChange={(e) => setEndsOnMonth(e.target.value)}
                  className="w-full border border-border rounded-[var(--radius-btn)] px-4 py-3 text-fg focus:outline-none focus:border-accent transition font-mono"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-btn)] px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || deleting || loadingMeta}
        className="bg-accent text-accent-fg rounded-[var(--radius-btn)] px-4 py-4 font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Guardando…' : submitLabel}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting || deleting}
          className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 transition disabled:opacity-60 disabled:cursor-not-allowed py-2"
        >
          <Trash2 size={18} />
          {deleting ? 'Borrando…' : 'Borrar gasto'}
        </button>
      )}
    </form>
  )
}
