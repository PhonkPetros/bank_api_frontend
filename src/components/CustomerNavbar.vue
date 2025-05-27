<template>
  <nav class="customer-navbar">
    <router-link to="/customer/atm" class="nav-link">ATM</router-link>
    <router-link to="/customer/transfer" class="nav-link">Transfer</router-link>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.customer-navbar {
  display: flex;
  gap: 24px;
  background: #1976d2;
  padding: 16px 32px;
  align-items: center;
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
</style> 