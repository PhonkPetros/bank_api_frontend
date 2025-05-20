<template>
  <div class="approval-queue">
    <h2>Approval Queue</h2>

    <div v-if="loading" class="loading-message">
      Loading unapproved customers...
    </div>

    <div v-if="error" class="error-message">
      Error fetching unapproved customers: {{ error }}
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
            <td>{{ customer.phoneNumber }}</td>
            <td>
              <button @click="handleApproveCustomer(customer.id)" :disabled="customer.approving" class="approve-btn">
                {{ customer.approving ? 'Approving...' : 'Approve' }}
              </button>
              <span v-if="customer.approvalError" class="approval-error">{{ customer.approvalError }}</span>
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
    unapprovedCustomers.value = response.data.map(customer => ({ ...customer, approving: false, approvalError: null }));
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
    // Refresh the list after approval
    // Alternatively, remove the customer from the list locally for better UX
    unapprovedCustomers.value = unapprovedCustomers.value.filter(c => c.id !== customerId);
    // Optionally, show a success message
  } catch (err) {
    console.error(`Failed to approve customer ${customerId}:`, err);
    customer.approvalError = err.response?.data?.message || err.message || 'Failed to approve.';
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
  border: 1px solid #eee;
  margin-top: 10px;
}

.loading-message,
.error-message,
.no-customers-message {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.loading-message {
  background-color: #e3f2fd; /* Light blue */
  color: #1e88e5;
}

.error-message,
.approval-error {
  background-color: #ffebee; /* Light red */
  color: #c62828;
}

.approval-error {
    display: block;
    font-size: 0.9em;
    margin-top: 5px;
}

.no-customers-message {
  background-color: #f9f9f9;
  color: #555;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.customers-table th,
.customers-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

.customers-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.approve-btn {
  padding: 6px 12px;
  background-color: #4CAF50; /* Green */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.approve-btn:hover {
  background-color: #45a049;
}

.approve-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 