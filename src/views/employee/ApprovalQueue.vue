<template>
  <div class="approval-queue">
    <h2>Customer Approval Queue</h2>

    <div v-if="loading" class="loading-message">
      Loading unapproved customers...
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="!loading && !error && unapprovedCustomers.length === 0" class="no-customers-message">
      There are no customers currently pending approval.
    </div>

    <div v-if="!loading && !error && unapprovedCustomers.length > 0">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>BSN</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in unapprovedCustomers" :key="customer.id">
            <td>{{ customer.firstName }} {{ customer.lastName }}</td>
            <td>{{ customer.email }}</td>
            <td>{{ customer.bsn }}</td>
            <td>{{ customer.phone }}</td>
            <td>
              <button 
                @click="handleApproveCustomer(customer.id)" 
                :disabled="customer.approving" 
                class="approve-btn"
              >
                {{ customer.approving ? 'Approving...' : 'Approve' }}
              </button>
              <span v-if="customer.approvalError" class="approval-error">
                {{ customer.approvalError }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getUnapprovedCustomers, approveCustomer } from '@/services/employeeApi';

const unapprovedCustomers = ref([]);
const loading = ref(false);
const error = ref(null);

const fetchUnapprovedCustomers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await getUnapprovedCustomers();
    unapprovedCustomers.value = response.data.map(customer => ({
      ...customer,
      approving: false,
      approvalError: null
    }));
  } catch (err) {
    console.error('Failed to fetch unapproved customers:', err);
    error.value = err.response?.data?.message || err.message || 'An unexpected error occurred.';
  } finally {
    loading.value = false;
  }
};

const handleApproveCustomer = async (customerId) => {
  const customer = unapprovedCustomers.value.find(c => c.id === customerId);
  if (!customer) return;

  customer.approving = true;
  customer.approvalError = null;

  try {
    await approveCustomer(customerId);
    // Remove the approved customer from the list
    unapprovedCustomers.value = unapprovedCustomers.value.filter(c => c.id !== customerId);
  } catch (err) {
    console.error(`Failed to approve customer ${customerId}:`, err);
    customer.approvalError = err.response?.data?.message || err.message || 'Failed to approve customer.';
  } finally {
    customer.approving = false;
  }
};

onMounted(() => {
  fetchUnapprovedCustomers();
});
</script>

<style scoped>
.approval-queue {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading-message,
.error-message,
.no-customers-message {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.loading-message {
  background-color: #e3f2fd;
  color: #1976d2;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

.no-customers-message {
  background-color: #f5f5f5;
  color: #616161;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.customers-table th,
.customers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.customers-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #424242;
}

.customers-table tr:hover {
  background-color: #fafafa;
}

.approve-btn {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.approve-btn:hover:not(:disabled) {
  background-color: #43a047;
}

.approve-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.approval-error {
  display: block;
  color: #c62828;
  font-size: 12px;
  margin-top: 4px;
}
</style> 