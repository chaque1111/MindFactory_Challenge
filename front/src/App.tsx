import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProcessListPage } from './pages/ProcessListPage'
import { UploadProcessPage } from './pages/UploadProcessPage'
import { DetailProcessPage } from './pages/DetailProcessPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="top-nav">
          <h1>MindFactory Data Normalizer</h1>
          <nav className="nav-links">
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <NavLink to="/jobs">Listado de Registros</NavLink>
            <NavLink to="/upload">Cargar Registros</NavLink>
          </nav>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/jobs" element={<ProcessListPage />} />
            <Route path="/processes" element={<ProcessListPage />} />
            <Route path="/upload" element={<UploadProcessPage />} />
            <Route path="/detailJob/:id" element={<DetailProcessPage />} />
            <Route path="/detailProcess/:id" element={<DetailProcessPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
