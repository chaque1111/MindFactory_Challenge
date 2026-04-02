import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { ProcessListResponse, ProcessRecord, ProcessRow } from '../types/process'
import { API_BASE_URL, buildApiUrl } from '../config/api'

const RECORDS_URL = buildApiUrl('/records')

interface LocationState {
  record?: ProcessRecord
}

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

function formatArray(value: string[] | null): string {
  if (!value || value.length === 0) {
    return 'N/A'
  }

  return value.join(', ')
}

function formatJson(value: unknown | null): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  try {
    return JSON.stringify(value)
  } catch {
    return 'N/A'
  }
}

export function DetailProcessPage() {
  const ROWS_PER_PAGE = 5
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  const [record, setRecord] = useState<ProcessRecord | null>(state.record ?? null)
  const [loading, setLoading] = useState(!state.record)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!id) {
      return
    }

    const fetchDetail = async () => {
      try {
        setLoading(true)
        setError('')

        const detailResponse = await fetch(`${RECORDS_URL}/${id}`)
        if (detailResponse.ok) {
          const detailPayload = (await detailResponse.json()) as ProcessRecord
          setRecord(detailPayload)
          return
        }

        const response = await fetch(RECORDS_URL)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: no se pudo cargar el detalle`)
        }

        const payload = (await response.json()) as ProcessListResponse
        const found = payload.data.find((item) => item.id === id) ?? null
        if (!found) {
          throw new Error('No se encontró el trabajo solicitado')
        }

        setRecord(found)
      } catch (err) {
        const message =
          err instanceof TypeError
            ? `No se pudo conectar al backend. Verifica VITE_API_URL (${API_BASE_URL || 'no configurado'})`
            : err instanceof Error
              ? err.message
              : 'Error desconocido al cargar detalle'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchDetail()
  }, [id, state.record])

  const items = useMemo(() => {
    if (!record) {
      return []
    }

    return [
      ['ID', record.id],
      ['Archivo', record.fileName],
      ['Estado', record.status],
      ['Total filas', String(record.totalRows)],
      ['Total registros', String(record.totalRecords)],
      ['Procesadas', String(record.processedRows)],
      ['Validas', String(record.validRecords)],
      ['Invalidas', String(record.invalidRecords)],
      ['Advertencias', String(record.warningRecords)],
      ['AI intervenida', record.aiIntervened ? 'Si' : 'No'],
      ['AI input tokens', String(record.aiInputTokens)],
      ['AI output tokens', String(record.aiOutputTokens)],
      ['AI total tokens', String(record.aiTotalTokens)],
      ['Inicio', formatDate(record.startedAt)],
      ['Fin', formatDate(record.finishedAt)],
      ['Duracion (ms)', String(record.durationMs ?? 'N/A')],
      ['Error', record.errorMessage ?? 'N/A'],
      ['Creado', formatDate(record.createdAt)],
      ['Actualizado', formatDate(record.updatedAt)],
    ] as const
  }, [record])

  return (
    <section className="page">
      <h2>Detalle del Trabajo</h2>
      <div className="actions" style={{ marginBottom: '14px' }}>
        <Link className="button" to="/jobs">
          Volver al listado
        </Link>
      </div>

      {loading && <p>Cargando detalle...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && record && (
        <>
          <div className="detail-grid">
            {items.map(([label, value]) => (
              <article key={label} className="detail-item">
                <strong>{label}</strong>
                <p>{value}</p>
              </article>
            ))}
          </div>

          <h3 style={{ marginTop: '20px' }}>Movimientos del Trabajo</h3>
          <RowsTable
            rows={record.rows ?? []}
            currentPage={currentPage}
            rowsPerPage={ROWS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </section>
  )
}

interface RowsTableProps {
  rows: ProcessRow[]
  currentPage: number
  rowsPerPage: number
  onPageChange: (page: number) => void
}

function RowsTable({ rows, currentPage, rowsPerPage, onPageChange }: RowsTableProps) {
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * rowsPerPage
  const visibleRows = rows.slice(start, start + rowsPerPage)

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="table-wrap records-table-wrap movement-table-wrap">
      <div className="movement-header">
        <div className="records-count">
          <strong>{rows.length}</strong>
          <span>movimientos</span>
        </div>
        <p className="muted">
          Pagina {safePage} de {totalPages}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Source ID</th>
            <th>Fecha</th>
            <th>Moneda</th>
            <th>Monto</th>
            <th>Descripcion</th>
            <th>Contraparte</th>
            <th>CUIT/Tax ID</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Tipo costo</th>
            <th>Estado</th>
            <th>Error mensaje</th>
            <th>Error fila</th>
            <th>Job ID</th>
            <th>Extra JSON</th>
            <th>Creado</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id} className="record-row">
              <td className="mono-cell">{row.id}</td>
              <td>{row.sourceId ?? 'N/A'}</td>
              <td>{row.transactionDate ?? 'N/A'}</td>
              <td>{row.currency ?? 'N/A'}</td>
              <td className="mono-cell">{row.amount ?? 'N/A'}</td>
              <td className="wrap-cell">{row.description ?? 'N/A'}</td>
              <td>{row.counterpartyName ?? 'N/A'}</td>
              <td>{row.counterpartyTaxId ?? 'N/A'}</td>
              <td className="wrap-cell">{row.counterpartyEmail ?? 'N/A'}</td>
              <td>{row.counterpartyRole ?? 'N/A'}</td>
              <td>{row.costType ?? 'N/A'}</td>
              <td>
                <span className={getStatusClass(row.status)}>{row.status}</span>
              </td>
              <td className="wrap-cell">{formatArray(row.errorMessage)}</td>
              <td className="mono-cell">{row.errorRowNumber ?? 'N/A'}</td>
              <td className="mono-cell">{row.jobId}</td>
              <td className="mono-cell wrap-cell">{formatJson(row.extraJson)}</td>
              <td>{formatDate(row.createdAt)}</td>
              <td>{formatDate(row.updatedAt)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={18}>Este trabajo no tiene movimientos.</td>
            </tr>
          )}
        </tbody>
      </table>

      {rows.length > 0 && (
        <div className="pagination">
          <button
            className="button"
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
          >
            Anterior
          </button>

          {pages.map((page) => (
            <button
              key={page}
              className={`button ${page === safePage ? 'primary' : ''}`}
              type="button"
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="button"
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
