import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { API_BASE_URL, buildApiUrl } from '../config/api'

const UPLOAD_URL = buildApiUrl('/records/upload')

interface UploadJobResponse {
  id: string
  fileName: string
  status: string
  durationMs: number | null
  rows?: unknown[]
}

function isCsvFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  const byExtension = lowerName.endsWith('.csv')
  const byMimeType = file.type === 'text/csv' || file.type === 'application/vnd.ms-excel'
  return byExtension || byMimeType
}

export function UploadProcessPage() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (uploading) {
      document.body.classList.add('is-uploading')
      return
    }

    document.body.classList.remove('is-uploading')
    return () => {
      document.body.classList.remove('is-uploading')
    }
  }, [uploading])

  const handleSelectClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError('')
    setSuccess('')
    setFileName('')
    setSelectedFile(null)

    if (!file) {
      return
    }

    if (!isCsvFile(file)) {
      setError('El archivo seleccionado no es CSV. Por favor selecciona un .csv')
      event.target.value = ''
      return
    }

    setFileName(file.name)
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    setError('')
    setSuccess('')

    if (!selectedFile) {
      setError('Primero selecciona un archivo CSV')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: no se pudo cargar el trabajo`)
      }

      const payload = (await response.json()) as UploadJobResponse
      setSuccess(
        `Trabajo creado correctamente (${payload.id}) - Estado: ${payload.status} - Duracion: ${
          payload.durationMs ?? 'N/A'
        } ms`,
      )
      setSelectedFile(null)
      setFileName('')
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (err) {
      const message =
        err instanceof TypeError
          ? `No se pudo conectar al backend. Verifica VITE_API_URL (${API_BASE_URL || 'no configurado'})`
          : err instanceof Error
            ? err.message
            : 'Error desconocido al cargar el archivo'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="page">
      <h2>Cargar Trabajos</h2>
      <p className="muted">
        Esta vista permite seleccionar un archivo CSV, validarlo y enviarlo a{' '}
        <code>{UPLOAD_URL}</code>.
      </p>

      <div className="actions" style={{ marginTop: '16px' }}>
        <button className="button primary" type="button" onClick={handleSelectClick}>
          Seleccionar archivo CSV
        </button>
        <button
          className="button"
          type="button"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Subiendo...' : 'Subir archivo'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {fileName && (
        <p className="success-text" style={{ marginTop: '12px' }}>
          Archivo válido seleccionado: {fileName}
        </p>
      )}
      {success && (
        <p className="success-text" style={{ marginTop: '12px' }}>
          {success}
        </p>
      )}
      {error && (
        <p className="error-text" style={{ marginTop: '12px' }}>
          {error}
        </p>
      )}

      {uploading && (
        <div className="upload-loader-card" role="status" aria-live="polite">
          <span className="loader-spinner" aria-hidden="true"></span>
          <p>Subiendo archivo y creando trabajo...</p>
        </div>
      )}
    </section>
  )
}
