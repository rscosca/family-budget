import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Category, FamilyMember } from '../lib/types'
import { getIcon } from '../lib/icons'

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
  members: FamilyMember[]
  selectedCategoryIds: number[]
  selectedMemberIds: number[]
  onToggleCategory: (id: number) => void
  onToggleMember: (id: number) => void
  onClear: () => void
}

export default function FilterSheet({
  open,
  onClose,
  categories,
  members,
  selectedCategoryIds,
  selectedMemberIds,
  onToggleCategory,
  onToggleMember,
  onClear,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const hasFilters = selectedCategoryIds.length > 0 || selectedMemberIds.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Filtros"
        className="relative w-full lg:max-w-lg bg-surface border border-border rounded-t-[var(--radius-card)] lg:rounded-[var(--radius-card)] max-h-[85vh] flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-1 bg-border rounded-full lg:hidden absolute left-1/2 -translate-x-1/2 top-2" />
            <h2 className="font-display font-bold text-lg">Filtros</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-3">Categorías</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const Icon = getIcon(c.icon)
                const selected = selectedCategoryIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggleCategory(c.id)}
                    aria-pressed={selected}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-btn)] border text-sm font-medium transition"
                    style={
                      selected
                        ? {
                            backgroundColor: `${c.color}26`,
                            borderColor: c.color,
                            color: c.color,
                          }
                        : {
                            backgroundColor: 'transparent',
                            borderColor: 'var(--color-border)',
                          }
                    }
                  >
                    <Icon size={16} />
                    <span className="truncate">{c.name}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-3">Miembros</h3>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const selected = selectedMemberIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onToggleMember(m.id)}
                    aria-pressed={selected}
                    className="px-4 py-2 rounded-[var(--radius-pill)] border text-sm font-medium transition"
                    style={
                      selected
                        ? {
                            backgroundColor: `${m.color}26`,
                            borderColor: m.color,
                            color: m.color,
                          }
                        : {
                            backgroundColor: 'transparent',
                            borderColor: 'var(--color-border)',
                          }
                    }
                  >
                    {m.name}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasFilters}
            className="flex-1 py-3 rounded-[var(--radius-btn)] text-sm font-medium text-muted hover:text-fg transition disabled:opacity-40 disabled:hover:text-muted"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[var(--radius-btn)] bg-accent text-accent-fg text-sm font-semibold hover:brightness-110 transition"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
