<template>
  <div class="employee-dashboard">
    <header class="dashboard-header">
      <h1>Employee Dashboard</h1>
      <button @click="logout" class="logout-button">Logout</button>
    </header>
    <nav>
      <ul>
        <li><router-link to="/employee/customer-management">Customer Management</router-link></li>
        <li><router-link to="/employee/approval-queue">Approval Queue</router-link></li>
        <li><router-link to="/employee/transfer">Initiate Transfer</router-link></li>
        <li><router-link to="/employee/account-settings">Account Settings</router-link></li>
      </ul>
    </nav>
    <router-view></router-view> <!-- For nested employee routes if needed -->
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'EmployeeDashboard',
  setup() {
    const router = useRouter();

    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    };

    return {
      logout,
    };
  },
  // Add any necessary logic here, e.g., fetching initial data
};
</script>

<style scoped>
.employee-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logout-button {
  padding: 8px 15px;
  background-color: #f44336; /* Red */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.logout-button:hover {
  background-color: #d32f2f;
}

nav ul {
  list-style-type: none;
  padding: 0;
}
nav ul li {
  display: inline-block;
  margin-right: 15px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
nav ul li a {
  text-decoration: none;
  color: #2c3e50;
}
nav ul li a:hover {
  color: #42b983;
}
</style> 