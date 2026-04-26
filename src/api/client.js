import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

let onUnauthorized = null
export const setOnUnauthorized = (fn) => { onUnauthorized = fn }

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && onUnauthorized) onUnauthorized()
    return Promise.reject(err)
  },
)

export const extractError = (err) => {
  const data = err.response?.data
  if (!data) return err.message || 'Network error'
  if (typeof data === 'string') return data
  if (data.error) return data.error
  if (data.message) return data.message
  if (data.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).join(', ')
  }
  return 'Unknown error'
}

export const extractFieldErrors = (err) => {
  const data = err.response?.data
  if (data?.errors && typeof data.errors === 'object') return data.errors
  return {}
}

export default client
