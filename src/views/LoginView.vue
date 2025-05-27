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

const router = useRouter()
const eventBus = useEventBus()
const email = ref('')
const password = ref('')
const showEmailError = ref(false)
const passwordError = ref('')
const loading = ref(false)

const validateForm = () => {
  let isValid = true
  
  // Reset errors
  showEmailError.value = false
  passwordError.value = ''
  
  if (!email.value) {
    showEmailError.value = true
    passwordError.value = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    showEmailError.value = true
    passwordError.value = 'Please enter a valid email address'
    isValid = false
  }
  
  if (!password.value) {
    passwordError.value = 'Password is required'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  showEmailError.value = false
  passwordError.value = ''
  loading.value = true
  
  if (!validateForm()) {
    loading.value = false
    return
  }
  
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, {
      email: email.value,
      password: password.value
    })
    
    // Store the token and user info in localStorage
    console.log('Login response:', response.data)
    console.log('Token from response:', response.data.token)
    
    localStorage.setItem('token', response.data.token)
    console.log('Token stored in localStorage:', localStorage.getItem('token'))
    
    localStorage.setItem('user', JSON.stringify({
      id: response.data.id,
      email: response.data.email,
      role: response.data.role,
      approved: response.data.approved
    }))
    console.log('User stored in localStorage:', localStorage.getItem('user'))
    
    // Emit login event to update navbar
    const emittedUserData = {
      id: response.data.id,
      email: response.data.email,
      role: response.data.role,
      approved: response.data.approved
    };
    eventBus.emit('user-logged-in', emittedUserData);
    
    const userRole = response.data.role;
    const isApproved = response.data.approved;

    // Wait a moment to ensure localStorage is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    if (userRole === 'EMPLOYEE') {
      nextTick(() => {
        router.push('/employee/customer-management');
      });
    } else if (userRole === 'CUSTOMER') {
      if (isApproved) {
        nextTick(() => {
          router.push('/customer/atm');
        });
      } else {
        nextTick(() => {
          router.push('/welcome');
        });
      }
    } else {
      console.warn('Unknown user role after login, redirecting to /login.');
      nextTick(() => {
        router.push('/login');
      });
    }
  } catch (err) {
    console.error('Login failed:', err);

    if (err.response && err.response.data) {
      const errorData = err.response.data; // This is likely the string from backend
      let serverMessage = '';

      if (typeof errorData === 'string') {
        serverMessage = errorData;
      } else if (typeof errorData === 'object' && errorData.message) { // If backend sends JSON like {message: "..."}
        serverMessage = errorData.message;
      } else if (typeof errorData === 'object') { // If backend sends other JSON without .message
        serverMessage = 'An error occurred processing the response.'; 
      } else {
        serverMessage = 'An unknown error occurred during login.';
      }

      // Check for "pending approval"
      if (serverMessage.includes('pending approval')) {
        let role = 'CUSTOMER'; // Default role
        const approved = false; // User is pending approval

        // Attempt to parse role from the backend string: "User account is pending approval. Role: ROLENAME, Approved: false"
        const roleMatch = serverMessage.match(/Role: (\w+)/);
        if (roleMatch && roleMatch[1]) {
            role = roleMatch[1];
        }
        // Note: The 'Approved' status from such a string for a DisabledException should inherently be false.

        localStorage.setItem('user', JSON.stringify({
          email: email.value, // Get email from form
          role: role,
          approved: approved
          // ID is not available from the current backend string response for this case
        }));
        localStorage.removeItem('token'); // Ensure no token is stored

        // Optionally set a message, though redirect might be too fast for it to be seen for long
        passwordError.value = 'Your account is pending approval. Redirecting to welcome page...';
        
        // Perform hard redirect to welcome page
        // This was used previously and can be more robust for SPA guard interactions on initial unapproved login.
        nextTick(() => {
          window.location.href = '/welcome'; 
        });
        return; // Important to exit further error handling after redirect initiated

      } else if (serverMessage.includes('Invalid email or password') || serverMessage.includes('User not found')) {
        showEmailError.value = true;
        passwordError.value = 'Wrong password or email.';
      } else {
        // Other errors
        passwordError.value = serverMessage || 'Login failed. Please try again.';
      }
    } else {
      // Network error or no err.response.data (e.g., CORS issue, server down)
      passwordError.value = 'Login service unavailable or network issue. Please try again later.';
    }
  } finally {
    loading.value = false;
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
  margin-top: 1rem;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #357abd;
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

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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