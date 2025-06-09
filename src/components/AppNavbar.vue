<template>
  <nav class="app-navbar">
    <div class="nav-left">
      <template v-if="isLoggedIn && userRole === 'CUSTOMER' && userApproved">
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
      <template v-if="isLoggedIn">
        <span class="user-info">
          {{ userName }}
          <span v-if="userRole === 'CUSTOMER' && !userApproved" class="approval-status pending">
            (Pending Approval)
          </span>
        </span>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </template>
      <template v-else>
        <router-link to="/login" class="nav-link">Login</router-link>
        <router-link to="/register" class="nav-link">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventBus } from '@/composables/useEventBus'
import { getSession, logout, isAuthenticated, hasRole, isApproved } from '@/utils/sessionManager'

const router = useRouter()
const eventBus = useEventBus()
const isLoggedIn = ref(false)
const userRole = ref(null)
const userName = ref('')
const userApproved = ref(false)

const updateUserState = () => {
  const { user } = getSession()
  if (user) {
    isLoggedIn.value = true
    userRole.value = user.role
    userName.value = user.email
    userApproved.value = user.approved === true
  } else {
    isLoggedIn.value = false
    userRole.value = null
    userName.value = ''
    userApproved.value = false
  }
}

const handleLogout = () => {
  logout()
}

onMounted(() => {
  updateUserState()
  eventBus.on('user-logged-in', (userData) => {
    isLoggedIn.value = true
    userRole.value = userData.role
    userName.value = userData.email
    userApproved.value = userData.approved === true
  })
  eventBus.on('user-logged-out', () => {
    isLoggedIn.value = false
    userRole.value = null
    userName.value = ''
    userApproved.value = false
  })
})

onUnmounted(() => {
  eventBus.off('user-logged-in')
  eventBus.off('user-logged-out')
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
.approval-status {
  font-size: 0.8em;
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
}
.approval-status.pending {
  background-color: #fff3cd;
  color: #856404;
}
</style> 