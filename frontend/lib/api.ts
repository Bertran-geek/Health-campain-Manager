import axios from 'axios'
import Swal from 'sweetalert2'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let sessionExpiredShown = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')

      if (!sessionExpiredShown) {
        sessionExpiredShown = true
        const locale = document.documentElement.lang || 'fr'
        const isFr = locale === 'fr'

        Swal.fire({
          icon: 'warning',
          title: isFr ? 'Session expirée' : 'Session expired',
          text: isFr
            ? 'Votre session a expiré après 30 minutes. Veuillez vous reconnecter.'
            : 'Your session expired after 30 minutes. Please log in again.',
          confirmButtonText: isFr ? 'Se connecter' : 'Log in',
          confirmButtonColor: '#5C8BB0',
          background: 'rgba(15, 35, 55, 0.95)',
          color: '#ffffff',
          allowOutsideClick: false,
        }).then(() => {
          sessionExpiredShown = false
          window.location.href = `/${locale}/`
        })
      }
    }
    return Promise.reject(error)
  }
)

export default api
