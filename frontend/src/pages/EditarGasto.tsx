import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import ExpenseForm from '../components/ExpenseForm'
import { deleteExpense, getExpense, updateExpense } from '../lib/expenses'
import type { Expense } from '../lib/types'
import { ApiError } from '../lib/api'

export default function EditarGasto() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const expenseId = Number(id)

  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!expenseId || Number.isNaN(expenseId)) {
      setNotFound(true)
      setLoading(false)
      return
    }
    let cancelled = false
    getExpense(expenseId)
      .then((e) => {
        if (!cancelled) setExpense(e)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err.message ?? 'No se pudo cargar el gasto.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [expenseId])

  if (notFound) return <Navigate to="/historial" replace />

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/historial"
          aria-label="Volver"
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-fg hover:bg-white/5 transition"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl flex-1 text-center pr-10">Editar Gasto</h1>
      </div>

      {loading && <div className="text-muted text-sm py-8 text-center">Cargando…</div>}

      {error && !loading && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-btn)] px-4 py-3">
          {error}
        </div>
      )}

      {expense && (
        <ExpenseForm
          submitLabel="Guardar cambios"
          initialValues={{
            amount_cents: expense.amount_cents,
            description: expense.description,
            category_id: expense.category_id,
            family_member_id: expense.family_member_id,
            occurred_on: expense.occurred_on,
          }}
          onSubmit={async (input) => {
            await updateExpense(expense.id, input)
            navigate('/historial', { replace: true })
          }}
          onDelete={async () => {
            await deleteExpense(expense.id)
            navigate('/historial', { replace: true })
          }}
        />
      )}
    </>
  )
}
