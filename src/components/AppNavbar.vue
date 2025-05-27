<template>
  <nav class="app-navbar">
    <div class="nav-left">
      <template v-if="isLoggedIn && userRole === 'CUSTOMER'">
        <router-link to="/customer/atm" class="nav-link">ATM</router-link>
        <router-link to="/customer/transfer" class="nav-link">Transfer</router-link>
      </template>
      <template v-else-if="isLoggedIn && userRole === 'EMPLOYEE'">
        <router-link to="/employee/customer-management" class="nav-link">Customer Management</router-link>
        <router-link to="/employee/approval-queue" class="nav-link">Approval Queue</router-link>
        <router-link to="/employee/transfer" class="nav-link">Employee Transfer</router-link>
        <router-link to="/employee/all-transfers" class="nav-link">All Transfers</router-link>
      </template>
    </div>
    <div class="nav-right">
      <span v-if="isLoggedIn && userName" class="user-info">{{ userName }}</span>
      <router-link v-if="!isLoggedIn" to="/login" class="nav-link">Login</router-link>
      <button v-else @click="logout" class="logout-btn">Logout</button>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventBus } from '@/composables/useEventBus'

const router = useRouter()
const eventBus = useEventBus()
const isLoggedIn = ref(false)
const userRole = ref(null)
const userName = ref('')

const updateUserState = () => {
  const userString = localStorage.getItem('user')
  if (userString) {
    try {
      const user = JSON.parse(userString)
      isLoggedIn.value = true
      userRole.value = user.role
      userName.value = user.email
    } catch (e) {
      console.error('Error parsing user data:', e)
      isLoggedIn.value = false
      userRole.value = null
      userName.value = ''
    }
  } else {
    isLoggedIn.value = false
    userRole.value = null
    userName.value = ''
  }
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  isLoggedIn.value = false
  userRole.value = null
  userName.value = ''
  router.push('/login')
}

onMounted(() => {
  updateUserState()
  eventBus.on('user-logged-in', (userData) => {
    isLoggedIn.value = true
    userRole.value = userData.role
    userName.value = userData.email
  })
})

onUnmounted(() => {
  eventBus.off('user-logged-in')
})
</script>

<style scoped>
.app-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1976d2;
  padding: 16px 32px;
  position: sticky;
  top: 0;
  z-index: 1000;
}
.nav-left {
  display: flex;
  gap: 24px;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 18px;
  font-weight: 500;
  transition: color 0.2s;
}
.nav-link.router-link-exact-active {
  color: #ffeb3b;
}
.nav-link:hover {
  color: #90caf9;
}
.logout-btn {
  background: #f44336;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
}
.logout-btn:hover {
  background: #d32f2f;
}
.user-info {
  color: #fff;
  font-size: 16px;
  margin-right: 8px;
}
</style> 