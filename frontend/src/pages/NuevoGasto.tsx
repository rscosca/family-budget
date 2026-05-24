import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import ExpenseForm from '../components/ExpenseForm'
import { createExpense } from '../lib/expenses'

export default function NuevoGasto() {
  const navigate = useNavigate()

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          aria-label="Volver"
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-fg hover:bg-white/5 transition"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl flex-1 text-center pr-10">
          Añadir Gasto
        </h1>
      </div>

      <ExpenseForm
        submitLabel="Guardar Gasto"
        allowRecurring
        onSubmit={async (input) => {
          await createExpense(input)
          navigate('/', { replace: true })
        }}
      />
    </>
  )
}
