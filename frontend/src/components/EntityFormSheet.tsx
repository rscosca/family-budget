import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { getIcon, ICON_NAMES } from '../lib/icons'
import { ApiError } from '../lib/api'

export type EntityFormValues = {
  name: string
  color: string
  icon: string
  is_active?: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: Partial<EntityFormValues>
  onSubmit: (values: EntityFormValues) => Promise<void>
  showActiveToggle?: boolean
}

const DEFAULT_COLOR = '#F97316'

export default function EntityFormSheet({
  open,
  onClose,
  title,
  initialValues,
  onSubmit,
  showActiveToggle = true,
}: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [icon, setIcon] = useState<string>(ICON_NAMES[0])
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initialValues?.name ?? '')
    setColor(initialValues?.color ?? DEFAULT_COLOR)
    setIcon(initialValues?.icon ?? ICON_NAMES[0])
    setIsActive(initialValues?.is_active ?? true)
    setError(null)
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
  }, [open, initialValues, onClose])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Introduce un nombre.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        color,
        icon,
        is_active: isActive,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldError = err.errors && Object.values(err.errors)[0]?.[0]
        setError(fieldError ?? err.message)
      } else {
        setError('No se pudo guardar.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const PreviewIcon = getIcon(icon)

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full lg:max-w-lg bg-surface border border-border rounded-t-[var(--radius-card)] lg:rounded-[var(--radius-card)] max-h-[90vh] flex flex-col shadow-2xl"
      >
        <div className="relative flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <div className="w-9 h-1 bg-border rounded-full lg:hidden absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}26`, color }}
            >
              <PreviewIcon size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold truncate">{name || 'Vista previa'}</div>
              <div className="text-xs text-muted truncate font-mono">{color}</div>
            </div>
          </div>

          <div>
            <label htmlFor="entity-name" className="block font-display font-semibold mb-2">
              Nombre
            </label>
            <input
              id="entity-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
              className="w-full bg-surface border border-border rounded-[var(--radius-btn)] px-4 py-3 focus:outline-none focus:border-accent transition"
            />
          </div>

          <div>
            <label htmlFor="entity-color" className="block font-display font-semibold mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="entity-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-14 h-12 rounded-[var(--radius-btn)] border border-border bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                pattern="#[0-9A-Fa-f]{6}"
                maxLength={7}
                className="flex-1 bg-surface border border-border rounded-[var(--radius-btn)] px-4 py-3 font-mono focus:outline-none focus:border-accent transition"
              />
            </div>
          </div>

          <div>
            <span className="block font-display font-semibold mb-2">Icono</span>
            <div className="grid grid-cols-6 gap-2">
              {ICON_NAMES.map((name) => {
                const Icon = getIcon(name)
                const selected = icon === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIcon(name)}
                    aria-pressed={selected}
                    aria-label={name}
                    title={name}
                    className="aspect-square rounded-[var(--radius-btn)] border flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition"
                    style={
                      selected
                        ? { backgroundColor: `${color}26`, borderColor: color, color }
                        : { borderColor: 'var(--color-border)' }
                    }
                  >
                    <Icon size={20} />
                  </button>
                )
              })}
            </div>
          </div>

          {showActiveToggle && (
            <label className="flex items-center justify-between bg-surface border border-border rounded-[var(--radius-btn)] px-4 py-3 cursor-pointer">
              <span>
                <span className="font-display font-semibold block">Activo</span>
                <span className="text-xs text-muted">Aparece en listados y formularios.</span>
              </span>
              <span className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="block w-11 h-6 bg-border rounded-full peer-checked:bg-accent transition" />
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-fg rounded-full transition peer-checked:translate-x-5" />
              </span>
            </label>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-btn)] px-4 py-3">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[var(--radius-btn)] text-sm font-medium text-muted hover:text-fg transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-[var(--radius-btn)] bg-accent text-accent-fg text-sm font-semibold hover:brightness-110 transition disabled:opacity-60"
          >
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
