import { HashRouter, Route, Routes } from 'react-router-dom'
import AppShell from './layout/AppShell'
import StartPage from './pages/StartPage'
import KontrahenciPage from './pages/KontrahenciPage'
import NowyDokumentPage from './pages/NowyDokumentPage'
import HistoriaPage from './pages/HistoriaPage'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<StartPage />} />
          <Route path="/kontrahenci" element={<KontrahenciPage />} />
          <Route path="/nowy-dokument" element={<NowyDokumentPage />} />
          <Route path="/historia" element={<HistoriaPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
