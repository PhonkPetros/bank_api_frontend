<template>
  <div class="welcome-container">
    <div class="welcome-content">
      <h1>Welcome to Our Bank</h1>
      <div class="message-box">
        <p>Thank you for registering with us!</p>
        <p>Your account is currently pending approval by one of our employees.</p>
        <p>You will be able to access all banking features once your account is approved.</p>
        <p>We will notify you via email when your account is ready.</p>
      </div>
      <button @click="handleLogout" class="back-btn">Back to Login</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { logout } from '@/utils/sessionManager'

const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
}

.welcome-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.message-box {
  background-color: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.message-box p {
  margin: 1rem 0;
  color: #666;
  font-size: 1.1rem;
  line-height: 1.5;
}

.back-btn {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #1565c0;
}

@media (max-width: 480px) {
  .welcome-content {
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  .message-box {
    padding: 1.5rem;
  }

  .message-box p {
    font-size: 1rem;
  }
}
</style> 