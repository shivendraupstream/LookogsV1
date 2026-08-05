import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const username = localStorage.getItem('lookogs_username')
  const password = localStorage.getItem('lookogs_password')

  if (username && password) {
    config.auth = { username, password }
  }

  return config
})