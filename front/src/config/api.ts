const rawApiUrl = import.meta.env.VITE_API_URL ?? ''

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '')

export function buildApiUrl(path: string): string {
  console.log('localhost:5173/detailJob/1', rawApiUrl)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) {
    return normalizedPath
  }

  return `${API_BASE_URL}${normalizedPath}`
}
