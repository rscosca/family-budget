import { ChevronRight, LogOut, Tags, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'

export default function Ajustes() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'

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
