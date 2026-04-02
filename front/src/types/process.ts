export type ProcessStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | string

export interface ProcessRecord {
  id: string
  fileName: string
  status: ProcessStatus
  totalRows: number
  totalRecords: number
  processedRows: number
  validRecords: number
  invalidRecords: number
  warningRecords: number
  aiIntervened: boolean
  aiInputTokens: number
  aiOutputTokens: number
  aiTotalTokens: number
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  rows?: ProcessRow[]
}

export interface ProcessRow {
  id: string
  sourceId: string | null
  transactionDate: string | null
  currency: string | null
  amount: string | null
  description: string | null
  counterpartyName: string | null
  counterpartyTaxId: string | null
  counterpartyEmail: string | null
  counterpartyRole: string | null
  costType: string | null
  status: string
  extraJson: unknown | null
  errorMessage: string[] | null
  errorRowNumber: number | null
  jobId: string
  createdAt: string
  updatedAt: string
}

export interface ProcessMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ProcessListResponse {
  data: ProcessRecord[]
  meta: ProcessMeta
}
