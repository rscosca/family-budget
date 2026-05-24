import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { Home, Clock, MessageSquare, Settings, Plus, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', icon: Home, label: 'Inicio', end: true },
  { to: '/historial', icon: Clock, label: 'Historial', end: false },
  { to: '/familia', icon: MessageSquare, label: 'Familia', end: false },
  { to: '/ajustes', icon: Settings, label: 'Ajustes', end: false },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const hideFab = location.pathname === '/nuevo-gasto'

  return (
    <div className="min-h-full flex">
      {/* Sidebar — solo desktop */}
      <aside className="hidden lg:flex w-60 flex-col bg-surface border-r border-border p-6 gap-6">
        <div className="font-display font-bold text-2xl leading-tight">
          <div>Family</div>
          <div className="text-accent">Budget</div>
        </div>

        <Link
          to="/nuevo-gasto"
          className="flex items-center justify-center gap-2 bg-accent text-accent-fg rounded-[var(--radius-btn)] px-4 py-3 font-medium hover:opacity-90 transition"
        >
          <Plus size={20} strokeWidth={2.5} />
          Nuevo gasto
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-btn)] transition ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-fg hover:bg-white/5'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent text-accent-fg flex items-center justify-center text-sm font-semibold">
              {user.avatar_initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-muted truncate">@{user.username}</div>
            </div>
            <button
              onClick={() => logout()}
              aria-label="Cerrar sesión"
              className="text-muted hover:text-red-400 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 relative pb-32 lg:pb-0 min-w-0">
        <div className="max-w-3xl mx-auto px-5 lg:px-10 py-6">
          <Outlet />
        </div>

        {/* FAB — solo móvil, oculto en /nuevo-gasto */}
        {!hideFab && (
          <Link
            to="/nuevo-gasto"
            aria-label="Nuevo gasto"
            className="lg:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-lg shadow-accent/30 z-30"
          >
            <Plus size={26} strokeWidth={2.5} />
          </Link>
        )}
      </main>

      {/* Bottom nav — solo móvil */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around items-center pt-3 pb-6 z-20">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
