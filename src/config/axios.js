import axios from 'axios'
import { API_BASE_URL } from './api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add a request interceptor to add the auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('Request interceptor - Token exists:', !!token)
    console.log('Request interceptor - Full token:', token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Request interceptor - Added token to headers:', config.headers.Authorization)
      console.log('Request interceptor - Full config:', config)
    } else {
      console.warn('Request interceptor - No token found in localStorage')
    }
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response interceptor - Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers,
      config: error.config
    })
    
    if (error.response?.status === 401) {
      console.warn('Response interceptor - 401 Unauthorized')
      // Don't clear storage or redirect on 401, let the component handle it
      // This prevents the infinite redirect loop
    }
    return Promise.reject(error)
  }
)

export default axiosInstance 