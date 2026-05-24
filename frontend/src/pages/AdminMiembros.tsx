import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronLeft, Plus, RotateCcw, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EntityFormSheet, { type EntityFormValues } from '../components/EntityFormSheet'
import { useAuth } from '../context/AuthContext'
import {
  createFamilyMember,
  deleteFamilyMember,
  listFamilyMembers,
  updateFamilyMember,
} from '../lib/expenses'
import type { FamilyMember } from '../lib/types'
import { getIcon } from '../lib/icons'

export default function AdminMiembros() {
  const { user } = useAuth()
  const [items, setItems] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const data = await listFamilyMembers(true)
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
    const a: FamilyMember[] = []
    const i: FamilyMember[] = []
    for (const m of items) (m.is_active ? a : i).push(m)
    return { active: a, inactive: i }
  }, [items])

  if (!user) return null
  if (user.role !== 'admin') return <Navigate to="/ajustes" replace />

  async function handleSubmit(values: EntityFormValues) {
    if (editing) {
      const updated = await updateFamilyMember(editing.id, values)
      setItems((list) => list.map((m) => (m.id === editing.id ? updated : m)))
    } else {
      const created = await createFamilyMember({
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

  async function handleDelete(m: FamilyMember) {
    if (!window.confirm(`¿Desactivar "${m.name}"?\n\nLos gastos existentes mantienen su miembro, pero dejará de aparecer al crear o filtrar.`))
      return
    await deleteFamilyMember(m.id)
    setItems((list) => list.map((x) => (x.id === m.id ? { ...x, is_active: false } : x)))
  }

  async function handleReactivate(m: FamilyMember) {
    const updated = await updateFamilyMember(m.id, { is_active: true })
    setItems((list) => list.map((x) => (x.id === m.id ? updated : x)))
  }

  function renderRow(m: FamilyMember) {
    const Icon = getIcon(m.icon)
    return (
      <li
        key={m.id}
        className="bg-surface border border-border rounded-[var(--radius-card)] p-3 flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => {
            setEditing(m)
            setSheetOpen(true)
          }}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${m.color}26`, color: m.color }}
          >
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold truncate">{m.name}</div>
            <div className="text-xs text-muted font-mono">{m.color}</div>
          </div>
        </button>
        {m.is_active ? (
          <button
            type="button"
            onClick={() => handleDelete(m)}
            aria-label="Desactivar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 transition shrink-0"
          >
            <Trash2 size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleReactivate(m)}
            aria-label="Reactivar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition shrink-0"
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
          <PageHeader title="Miembros" subtitle="Personas a las que se atribuye un gasto" />
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
        Nuevo miembro
      </button>

      {loading && <div className="text-muted text-sm py-4">Cargando…</div>}

      {!loading && active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
            Activos ({active.length})
          </h2>
          <ul className="flex flex-col gap-2">{active.map(renderRow)}</ul>
        </section>
      )}

      {!loading && inactive.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
            Inactivos ({inactive.length})
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
        title={editing ? 'Editar miembro' : 'Nuevo miembro'}
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
