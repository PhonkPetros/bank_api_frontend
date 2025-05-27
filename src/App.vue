<template>
  <div id="app">
    <AppNavbar />
    <router-view />
  </div>
</template>

<script setup>
import AppNavbar from '@/components/AppNavbar.vue';
</script>

<style>
body {
  margin: 0;
  font-family: 'Roboto', Arial, sans-serif;
  background: #fafafa;
}
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
