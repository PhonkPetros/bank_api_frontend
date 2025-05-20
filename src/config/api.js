export const API_BASE_URL = 'http://localhost:8080'

export const API_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  APPROVE_CUSTOMER: (customerId) => `/api/employee/customers/${customerId}/approve`,
  GET_UNAPPROVED_CUSTOMERS: '/api/employee/customers/unapproved',
  GET_ALL_CUSTOMERS: '/api/employee/customers'
} 