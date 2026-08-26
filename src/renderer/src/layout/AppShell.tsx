import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Start', shortcut: '1' },
  { to: '/kontrahenci', label: 'Kontrahenci', shortcut: '2' },
  { to: '/nowy-dokument', label: 'Nowy dokument', shortcut: '3' },
  { to: '/historia', label: 'Historia', shortcut: '4' },
  { to: '/stan-magazynu', label: 'Stan magazynu', shortcut: '5' }
]

function AppShell(): React.JSX.Element {
  const navigate = useNavigate()
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    window.api.app
      .getVersion()
      .then(setVersion)
      .catch(() => setVersion(null))
  }, [])

  // Ctrl/Cmd+1..4 — szybka nawigacja, przydatna przy seryjnym wprowadzaniu dokumentów bez
  // odrywania rąk od klawiatury. Appka nie ma nigdzie śledzenia niezapisanych zmian (poza
  // window.confirm przy dezaktywacji kontrahenta), więc pomijamy skrót, gdy focus jest w polu
  // formularza — inaczej nawigacja mogłaby po cichu skasować częściowo wypełniony formularz
  // (np. Nowy dokument) bez ostrzeżenia.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!(event.ctrlKey || event.metaKey)) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return
      }
      const item = navItems.find((n) => n.shortcut === event.key)
      if (!item) return
      event.preventDefault()
      navigate(item.to)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Magazyn</h1>
          <p className="text-xs text-slate-400">Obsługa przyjęć i wydań</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <span>{item.label}</span>
              <span className="text-xs opacity-50">Ctrl+{item.shortcut}</span>
            </NavLink>
          ))}
        </nav>
        {version && <p className="text-xs text-slate-400">wersja {version}</p>}
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
