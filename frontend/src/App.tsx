import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Historial from './pages/Historial'
import Familia from './pages/Familia'
import Ajustes from './pages/Ajustes'
import NuevoGasto from './pages/NuevoGasto'
import EditarGasto from './pages/EditarGasto'
import AdminCategorias from './pages/AdminCategorias'
import AdminMiembros from './pages/AdminMiembros'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="historial" element={<Historial />} />
            <Route path="familia" element={<Familia />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="nuevo-gasto" element={<NuevoGasto />} />
            <Route path="gasto/:id" element={<EditarGasto />} />
            <Route path="admin/categorias" element={<AdminCategorias />} />
            <Route path="admin/miembros" element={<AdminMiembros />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
