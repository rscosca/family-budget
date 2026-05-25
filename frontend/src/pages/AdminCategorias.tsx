import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Power, RotateCcw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EntityFormSheet, { type EntityFormValues } from '../components/EntityFormSheet'
import { useAuth } from '../context/AuthContext'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../lib/expenses'
import type { Category } from '../lib/types'
import { getIcon } from '../lib/icons'

export default function AdminCategorias() {
  const { user } = useAuth()
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const data = await listCategories(true)
      setItems(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    refresh()
  }, [user])

  const { active, inactive } = useMemo(() => {
    const a: Category[] = []
    const i: Category[] = []
    for (const c of items) (c.is_active ? a : i).push(c)
    return { active: a, inactive: i }
  }, [items])

  if (!user) return null
  if (user.role !== 'admin') return <Navigate to="/ajustes" replace />

  async function handleSubmit(values: EntityFormValues) {
    if (editing) {
      const updated = await updateCategory(editing.id, values)
      setItems((list) => list.map((c) => (c.id === editing.id ? updated : c)))
    } else {
      const created = await createCategory({
        name: values.name,
        color: values.color,
        icon: values.icon,
        is_active: values.is_active,
      })
      setItems((list) => [...list, created])
    }
    setSheetOpen(false)
    setEditing(null)
  }

  async function handleDelete(c: Category) {
    if (!window.confirm(`¿Desactivar "${c.name}"?\n\nLos gastos existentes mantienen su categoría, pero dejará de aparecer al crear o filtrar.`))
      return
    await deleteCategory(c.id)
    setItems((list) => list.map((x) => (x.id === c.id ? { ...x, is_active: false } : x)))
  }

  async function handleReactivate(c: Category) {
    const updated = await updateCategory(c.id, { is_active: true })
    setItems((list) => list.map((x) => (x.id === c.id ? updated : x)))
  }

  function renderRow(c: Category) {
    const Icon = getIcon(c.icon)
    return (
      <li
        key={c.id}
        className="bg-surface border border-border rounded-[var(--radius-card)] p-3 flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => {
            setEditing(c)
            setSheetOpen(true)
          }}
          className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-[var(--radius-btn)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${c.color}26`, color: c.color }}
          >
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold truncate">{c.name}</div>
            <div className="text-xs text-muted font-mono">{c.color}</div>
          </div>
          <ChevronRight size={16} className="text-muted shrink-0" />
        </button>
        {c.is_active ? (
          <button
            type="button"
            onClick={() => handleDelete(c)}
            aria-label="Desactivar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition shrink-0"
          >
            <Power size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleReactivate(c)}
            aria-label="Reactivar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition shrink-0"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </li>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/ajustes"
          aria-label="Volver"
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-fg hover:bg-white/5 transition shrink-0"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <PageHeader title="Categorías" subtitle="Tipos de gasto disponibles" />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-btn)] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setEditing(null)
          setSheetOpen(true)
        }}
        className="w-full flex items-center justify-center gap-2 bg-accent text-accent-fg rounded-[var(--radius-btn)] py-3 font-semibold hover:brightness-110 transition mb-5"
      >
        <Plus size={18} />
        Nueva categoría
      </button>

      {loading && <div className="text-muted text-sm py-4">Cargando…</div>}

      {!loading && active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
            Activas ({active.length})
          </h2>
          <ul className="flex flex-col gap-2">{active.map(renderRow)}</ul>
        </section>
      )}

      {!loading && inactive.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
            Inactivas ({inactive.length})
          </h2>
          <ul className="flex flex-col gap-2 opacity-70">{inactive.map(renderRow)}</ul>
        </section>
      )}

      <EntityFormSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        initialValues={
          editing
            ? { name: editing.name, color: editing.color, icon: editing.icon, is_active: editing.is_active }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </>
  )
}
