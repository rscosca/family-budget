import { ChevronRight, KeyRound, LogOut, Tags, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { changePassword } from '../lib/auth'

export default function Ajustes() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide.')
      return
    }

    setSubmitting(true)
    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof ApiError) {
        const firstError = err.errors ? Object.values(err.errors)[0]?.[0] : null
        setError(firstError ?? err.message)
      } else {
        setError('No se pudo cambiar la contraseña.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Ajustes" />

      <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 mb-4">
        <div className="text-xs uppercase tracking-wide text-muted mb-2">Sesión</div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent text-accent-fg flex items-center justify-center font-semibold">
            {user?.avatar_initials}
          </div>
          <div>
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-muted">
              @{user?.username} · {user?.role === 'admin' ? 'Admin' : 'Colaborador'}
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      <form
        onSubmit={handleChangePassword}
        className="bg-surface border border-border rounded-[var(--radius-card)] p-6 mb-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-accent" />
          <div className="text-xs uppercase tracking-wide text-muted">Cambiar contraseña</div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted block mb-1">Contraseña actual</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted block mb-1">Nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <span className="text-[11px] text-muted block mt-1">Mínimo 8 caracteres.</span>
          </label>
          <label className="block">
            <span className="text-xs text-muted block mb-1">Confirmar nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </label>
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}
        {success && <div className="text-sm text-green-400">Contraseña actualizada.</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-accent-fg font-medium rounded-[var(--radius-btn)] py-2.5 text-sm transition disabled:opacity-60"
        >
          {submitting ? 'Guardando…' : 'Actualizar contraseña'}
        </button>
      </form>

      {isAdmin && (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
          <div className="text-xs uppercase tracking-wide text-muted px-6 pt-5 pb-2">
            Administración
          </div>
          <Link
            to="/admin/categorias"
            className="flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition border-t border-border"
          >
            <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <Tags size={18} />
            </span>
            <span className="flex-1">
              <span className="font-medium block">Categorías</span>
              <span className="text-xs text-muted">Crear, editar y desactivar tipos de gasto.</span>
            </span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          <Link
            to="/admin/miembros"
            className="flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition border-t border-border"
          >
            <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <Users size={18} />
            </span>
            <span className="flex-1">
              <span className="font-medium block">Miembros</span>
              <span className="text-xs text-muted">Personas a las que se atribuye un gasto.</span>
            </span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        </div>
      )}
    </>
  )
}
