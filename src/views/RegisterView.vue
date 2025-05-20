<template>
  <div class="register-container">
    <div class="register-form">
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <div v-if="success" class="success-message">
          {{ success }}
        </div>
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            v-model="firstName"
            required
            placeholder="Enter your first name"
            :disabled="loading"
            :class="{ 'error-input': firstNameError }"
          />
          <div v-if="firstNameError" class="field-error">{{ firstNameError }}</div>
        </div>
        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            v-model="lastName"
            required
            placeholder="Enter your last name"
            :disabled="loading"
            :class="{ 'error-input': lastNameError }"
          />
          <div v-if="lastNameError" class="field-error">{{ lastNameError }}</div>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
            :class="{ 'error-input': emailError }"
          />
          <div v-if="emailError" class="field-error">{{ emailError }}</div>
        </div>
        <div class="form-group">
          <label for="bsn">BSN Number</label>
          <input
            type="text"
            id="bsn"
            v-model="bsn"
            required
            placeholder="Enter your BSN number"
            pattern="[0-9]{8,9}"
            title="BSN must be 8 or 9 digits"
            :disabled="loading"
            :class="{ 'error-input': bsnError }"
          />
          <div v-if="bsnError" class="field-error">{{ bsnError }}</div>
        </div>
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            v-model="phone"
            required
            placeholder="Enter your phone number"
            :disabled="loading"
            :class="{ 'error-input': phoneError }"
          />
          <div v-if="phoneError" class="field-error">{{ phoneError }}</div>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Enter your password"
            minlength="6"
            :disabled="loading"
            :class="{ 'error-input': passwordError }"
          />
          <div v-if="passwordError" class="field-error">{{ passwordError }}</div>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Confirm your password"
            :disabled="loading"
            :class="{ 'error-input': confirmPasswordError }"
          />
          <div v-if="confirmPasswordError" class="field-error">{{ confirmPasswordError }}</div>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
        <p class="login-link">
          Already have an account? <router-link to="/login">Login here</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from '@/config/axios'
import { API_ENDPOINTS } from '@/config/api'

const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const bsn = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const success = ref('')

// Field-specific error messages
const firstNameError = ref('')
const lastNameError = ref('')
const emailError = ref('')
const bsnError = ref('')
const phoneError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

const validateForm = () => {
  let isValid = true
  
  // Reset all errors
  firstNameError.value = ''
  lastNameError.value = ''
  emailError.value = ''
  bsnError.value = ''
  phoneError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  
  if (!firstName.value) {
    firstNameError.value = 'First name is required'
    isValid = false
  }
  
  if (!lastName.value) {
    lastNameError.value = 'Last name is required'
    isValid = false
  }
  
  if (!email.value) {
    emailError.value = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
    isValid = false
  }
  
  if (!bsn.value) {
    bsnError.value = 'BSN is required'
    isValid = false
  } else if (!/^\d{8,9}$/.test(bsn.value)) {
    bsnError.value = 'BSN must be 8 or 9 digits'
    isValid = false
  }
  
  if (!phone.value) {
    phoneError.value = 'Phone number is required'
    isValid = false
  } else if (!/^\+?\d{9,15}$/.test(phone.value)) {
    phoneError.value = 'Please enter a valid phone number'
    isValid = false
  }
  
  if (!password.value) {
    passwordError.value = 'Password is required'
    isValid = false
  } else if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long'
    isValid = false
  }
  
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
    isValid = false
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    isValid = false
  }
  
  return isValid
}

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      bsn: bsn.value,
      phone: phone.value,
      password: password.value
    })
    
    success.value = response.data
    // Clear form
    firstName.value = ''
    lastName.value = ''
    email.value = ''
    bsn.value = ''
    phone.value = ''
    password.value = ''
    confirmPassword.value = ''
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    console.error('Registration failed:', error)
    if (error.response?.data) {
      error.value = error.response.data
    } else {
      error.value = 'Registration failed. Please try again later.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
}

.register-form {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

@media (min-width: 768px) {
  .register-form {
    padding: 3rem;
    min-width: 500px;
  }
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
}

.form-group {
  margin-bottom: 1.5rem;
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
  transition: border-color 0.3s ease;
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
  margin-top: 1.5rem;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #357abd;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.95rem;
}

.login-link a {
  color: #4a90e2;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-form {
    padding: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  input, .submit-btn {
    padding: 0.625rem;
  }

  .form-group {
    margin-bottom: 1rem;
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

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.field-error {
  color: #c62828;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
  min-height: 1.2em;
}

.error-input {
  border-color: #c62828 !important;
}

.error-input:focus {
  box-shadow: 0 0 0 2px rgba(198, 40, 40, 0.1) !important;
}
</style> 