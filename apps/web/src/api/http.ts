import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? 'http://localhost:5175/api',
  timeout: 10000
})
