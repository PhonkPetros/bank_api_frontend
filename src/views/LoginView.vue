<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
            :class="{ 'error-input': showEmailError }"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Enter your password"
            :disabled="loading"
            :class="{ 'error-input': passwordError }"
          />
          <div v-if="passwordError" class="field-error">{{ passwordError }}</div>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <p class="register-link">
          Don't have an account? <router-link to="/register">Register here</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from '@/config/axios'
import { API_ENDPOINTS } from '@/config/api'
import { useEventBus } from '@/composables/useEventBus'
import { clearSession } from '@/utils/sessionManager'

const router = useRouter()
const eventBus = useEventBus()
const email = ref('')
const password = ref('')
const showEmailError = ref(false)
const passwordError = ref('')
const loading = ref(false)

const validateForm = () => {
  let isValid = true
  const errors = {
    email: '',
    password: ''
  }
  
  // Email validation
  if (!email.value.trim()) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }
  
  // Password validation
  if (!password.value) {
    errors.password = 'Password is required'
    isValid = false
  } else if (password.value.length < 6) {
    errors.password = 'Password must be at least 6 characters long'
    isValid = false
  }
  
  // Update error states
  showEmailError.value = !!errors.email
  passwordError.value = errors.password
  
  return isValid
}

const handleLogin = async () => {
  // Reset error states
  showEmailError.value = false
  passwordError.value = ''
  loading.value = true
  
  // Validate form before submission
  if (!validateForm()) {
    loading.value = false
    return
  }
  
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, {
      email: email.value.trim(),
      password: password.value
    })
    
    const userData = {
      id: response.data.id,
      email: response.data.email,
      role: response.data.role,
      approved: response.data.approved
    }
    
    // Store the token and user info
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Emit login event to update navbar immediately
    eventBus.emit('user-logged-in', userData)
    
    const userRole = response.data.role
    const isApproved = response.data.approved

    // Wait for state updates
    await nextTick()

    if (userRole === 'EMPLOYEE') {
      router.push('/employee/customer-management')
    } else if (userRole === 'CUSTOMER') {
      router.push(isApproved ? '/customer/atm' : '/welcome')
    } else {
      console.warn('Unknown user role after login')
      clearSession()
      router.push('/login')
    }
  } catch (err) {
    console.error('Login failed:', err)
    clearSession()

    // Handle specific error cases
    if (err.response) {
      const status = err.response.status
      const data = err.response.data
      let errorMessage = ''

      // Handle different types of error responses
      if (typeof data === 'string') {
        errorMessage = data
      } else if (data && typeof data === 'object') {
        errorMessage = data.message || data.error || 'Login failed'
      }

      switch (status) {
        case 400:
          if (errorMessage.includes('pending approval')) {
            let role = 'CUSTOMER'
            const roleMatch = errorMessage.match(/Role: (\w+)/)
            if (roleMatch && roleMatch[1]) {
              role = roleMatch[1]
            }

            const pendingUserData = {
              email: email.value.trim(),
              role: role,
              approved: false
            }
            localStorage.setItem('user', JSON.stringify(pendingUserData))
            localStorage.removeItem('token')

            // Emit login event for pending approval
            eventBus.emit('user-logged-in', pendingUserData)

            passwordError.value = 'Your account is pending approval. Redirecting to welcome page...'
            router.push('/welcome')
            return
          }
          showEmailError.value = true
          passwordError.value = 'Invalid email or password'
          break

        case 401:
          showEmailError.value = true
          passwordError.value = 'Invalid email or password'
          break

        case 403:
          passwordError.value = 'Account is disabled or locked'
          break

        case 404:
          showEmailError.value = true
          passwordError.value = 'Account not found'
          break

        case 429:
          passwordError.value = 'Too many login attempts. Please try again later'
          break

        case 500:
          passwordError.value = 'Server error. Please try again later'
          break

        default:
          passwordError.value = errorMessage || 'Login failed. Please try again'
      }
    } else if (err.request) {
      // Network error (no response received)
      passwordError.value = 'Network error. Please check your connection and try again'
    } else {
      // Other errors
      passwordError.value = 'An unexpected error occurred. Please try again'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
}

.login-form {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

@media (min-width: 768px) {
  .login-form {
    padding: 3rem;
    min-width: 400px;
  }
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
}

.form-group {
  margin-bottom: 1rem;
  position: relative;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 1rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #357abd;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.95rem;
}

.register-link a {
  color: #4a90e2;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-form {
    padding: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  input, .submit-btn {
    padding: 0.625rem;
  }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.error-input {
  border-color: #dc3545 !important;
  background-color: #fff8f8 !important;
}

.field-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.loading-message {
  text-align: center;
  color: #666;
  margin-top: 1rem;
}
</style> 