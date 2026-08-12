import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Start' },
  { to: '/kontrahenci', label: 'Kontrahenci' },
  { to: '/nowy-dokument', label: 'Nowy dokument' },
  { to: '/historia', label: 'Historia' }
]

function AppShell(): React.JSX.Element {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <h1 className="mb-6 text-lg font-semibold">Magazyn</h1>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
