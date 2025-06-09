<template>
  <div class="home">
    <div class="home-content">
      <h1>Welcome to the Application</h1>
      <p>You are successfully logged in!</p>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { logout } from '@/utils/sessionManager'

const handleLogout = () => {
  logout()
}
</script>

<style scoped>
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
}

.home-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  text-align: center;
}

@media (min-width: 768px) {
  .home-content {
    padding: 3rem;
    min-width: 500px;
  }
}

h1 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.logout-btn {
  padding: 0.75rem 2rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background-color: #c82333;
}

@media (max-width: 480px) {
  .home-content {
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  p {
    font-size: 1rem;
  }

  .logout-btn {
    padding: 0.625rem 1.5rem;
  }
}
</style> 