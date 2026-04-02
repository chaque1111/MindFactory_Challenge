import { Link } from 'react-router-dom'
import mindFactoryLogo from '../assets/mindfactoryarg_logo.jpg'

export function HomePage() {
  return (
    <section className="page">
      <article className="home-hero">
        <img
          src={mindFactoryLogo}
          alt="Logo de MindFactory"
          className="home-hero-logo"
        />
        <div>
          <h2>MindFactory Data Normalizer</h2>
          <p className="muted">
            Gestiona cargas de archivos CSV y revisa el estado de cada Registros de movimientos.
          </p>
        </div>
      </article>

      <h2>Opciones disponibles</h2>
      <p className="muted">
        Usa estas opciones para gestionar tus trabajos de normalizacion.
      </p>

      <div className="actions" style={{ marginTop: '16px' }}>
        <Link className="button" to="/">
          Inicio
        </Link>
        <Link className="button" to="/jobs">
          Listado de Registros
        </Link>
        <Link className="button primary" to="/upload">
          Cargar Registros
        </Link>
      </div>
    </section>
  )
}
