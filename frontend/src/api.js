import axios from 'axios'
import {
  candidateBaseUrls,
  pickWorkingBase,
  withApiSuffix,
  HEALTH_TIMEOUT_MS,
  WINNER_STORAGE_KEY,
} from './lib/apiResolve'

function safeGet(k) {
  try { return window.localStorage.getItem(k) } catch (e) { return null }
}
function safeSet(k, v) {
  try { window.localStorage.setItem(k, v) } catch (e) { /* private mode */ }
}
function safeDel(k) {
  try { window.localStorage.removeItem(k) } catch (e) { /* private mode */ }
}

const isLocalhost =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'

// Static best-effort URL for code paths that cannot await (kept for compat).
// NOTE: the live request path always uses the probed winner (see below).
const API_URL = withApiSuffix(
  import.meta.env.VITE_API_URL ||
    (isLocalhost ? 'http://localhost:5000' : 'https://majismartv2-qmel.onrender.com')
)

async function probeHealth(baseUrl) {
  try {
    const r = await axios.get(baseUrl.replace(/\/$/, '') + '/health', {
      timeout: HEALTH_TIMEOUT_MS,
    })
    return r && r.status === 200
  } catch (e) {
    return false
  }
}

let resolvedBase = null
let resolvingPromise = null
const deadUrls = new Set()

function currentCandidates() {
  return candidateBaseUrls({
    envUrl: import.meta.env.VITE_API_URL,
    cachedUrl: safeGet(WINNER_STORAGE_KEY),
    isLocalhost,
  })
}

// Resolve once, share the in-flight promise across concurrent requests.
async function resolveBaseUrl({ force = false } = {}) {
  if (resolvedBase && !force) return resolvedBase
  if (resolvingPromise && !force) return resolvingPromise
  resolvingPromise = (async () => {
    const url = await pickWorkingBase({
      candidates: currentCandidates(),
      probe: probeHealth,
      dead: deadUrls,
    })
    // pickWorkingBase always returns candidates[0] as last resort
    resolvedBase = url || API_URL
    safeSet(WINNER_STORAGE_KEY, resolvedBase)
    return resolvedBase
  })()
  try {
    return await resolvingPromise
  } finally {
    resolvingPromise = null
  }
}

// Synchronous best-effort URL (cached winner → env → live default).
// For fetch() call-sites that cannot await the health probe.
export function getConfiguredApiUrl() {
  return (
    withApiSuffix(safeGet(WINNER_STORAGE_KEY)) ||
    API_URL
  )
}

export async function getActiveApiUrl() {
  return resolveBaseUrl()
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  async (config) => {
    try {
      config.baseURL = await resolveBaseUrl()
    } catch (e) {
      config.baseURL = getConfiguredApiUrl()
    }
    const token = safeGet('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const noResponse = !error.response
    const cfg = error.config || {}
    // Fail over exactly once, and ONLY when no server answered at all.
    // HTTP errors (401/400/500) mean we reached a backend — retrying those
    // elsewhere would risk double-submits and wrong error messages.
    if (noResponse && !cfg.__msRetried) {
      if (cfg.baseURL) deadUrls.add(cfg.baseURL)
      safeDel(WINNER_STORAGE_KEY)
      try {
        const url = await resolveBaseUrl({ force: true })
        cfg.__msRetried = true
        cfg.baseURL = url
        return api.request(cfg)
      } catch (e) {
        // fall through to the original network error mapping
      }
    }
    if (error.code === 'ECONNABORTED')
      return Promise.reject(
        new Error('Request timed out. The server may be waking up — please retry.')
      )
    if (!error.response)
      return Promise.reject(
        new Error('Cannot reach MajiSmart server. Check your connection and retry.')
      )
    if (error.response.status === 401) {
      try {
        window.localStorage.removeItem('token')
        window.localStorage.removeItem('user')
      } catch (e) { /* ignore */ }
    }
    const msg = error.response.data?.error || error.message
    return Promise.reject(new Error(msg))
  }
)

export default api
export { API_URL }
