import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProcessListResponse, ProcessRecord } from '../types/process'
import { API_BASE_URL, buildApiUrl } from '../config/api'

const RECORDS_URL = buildApiUrl('/records')

function formatDate(value: string | null): string {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function getStatusClass(status: string): string {
  const normalized = status.toUpperCase()
  if (normalized === 'COMPLETED') {
    return 'status-badge completed'
  }
  if (normalized === 'FAILED') {
    return 'status-badge failed'
  }
  if (normalized === 'PROCESSING') {
    return 'status-badge processing'
  }
  return 'status-badge pending'
}

export function ProcessListPage() {
  const [records, setRecords] = useState<ProcessRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(RECORDS_URL)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: no se pudo cargar la lista`)
        }

        const payload = (await response.json()) as ProcessListResponse
        setRecords(payload.data ?? [])
      } catch (err) {
        const message =
          err instanceof TypeError
            ? `No se pudo conectar al backend. Verifica VITE_API_URL (${API_BASE_URL || 'no configurado'})`
            : err instanceof Error
              ? err.message
              : 'Error desconocido al consultar Registros'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchRecords()
  }, [])

  return (
    <section className="page">
      <header className="list-header">
        <div>
          <h2>Listado de Registros</h2>
          <p className="muted">Consumiendo: {RECORDS_URL}</p>
        </div>
        <div className="records-count">
          <strong>{records.length}</strong>
          <span>Registros</span>
        </div>
      </header>

      {loading && <p>Cargando Registros...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="table-wrap records-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Total filas</th>
                <th>Total registros</th>
                <th>Filas procesadas</th>
                <th>Filas válidas</th>
                <th>Filas inválidas</th>

                <th>Intervenido por IA</th>
                <th>AI input tokens</th>
                <th>AI output tokens</th>
                <th>AI total tokens</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Duración (ms)</th>
                <th>Error</th>
                <th>Creado</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="record-row">
                  <td className="mono-cell">{record.id}</td>
                  <td>{record.fileName}</td>
                  <td>
                    <span className={getStatusClass(record.status)}>{record.status}</span>
                  </td>
                  <td>{record.totalRows}</td>
                  <td>{record.totalRecords}</td>
                  <td>{record.processedRows}</td>
                  <td>{record.validRecords}</td>
                  <td>{record.invalidRecords}</td>
    
                  <td>
                    <span
                      className={
                        record.aiIntervened ? 'status-badge completed' : 'status-badge pending'
                      }
                    >
                      {record.aiIntervened ? 'Si' : 'No'}
                    </span>
                  </td>
                  <td className="mono-cell">
                    {record.aiIntervened ? record.aiInputTokens : 'N/A'}
                  </td>
                  <td className="mono-cell">
                    {record.aiIntervened ? record.aiOutputTokens : 'N/A'}
                  </td>
                  <td className="mono-cell">
                    {record.aiIntervened ? record.aiTotalTokens : 'N/A'}
                  </td>
                  <td>{formatDate(record.startedAt)}</td>
                  <td>{formatDate(record.finishedAt)}</td>
                  <td className="mono-cell">{record.durationMs ?? 'N/A'}</td>
                  <td>{record.errorMessage ?? 'N/A'}</td>
                  <td>{formatDate(record.createdAt)}</td>
                  <td>{formatDate(record.updatedAt)}</td>
                  <td>
                    <Link
                      className="button"
                      to={`/detailJob/${record.id}`}
                      state={{ record }}
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={20}>No hay Registros registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
