<template>
  <div class="employee-transfer">
    <h2>Initiate Transfer for Customer</h2>
    <p>Perform fund transfers between accounts on behalf of customers.</p>

    <div v-if="loading" class="loading-message">Loading accounts...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <form v-if="!loading" @submit.prevent="handleTransfer">
      <div class="form-group">
        <label>Source Account (Customer & IBAN)</label>
        <select v-model="selectedSource" required>
          <option value="" disabled>Select source account</option>
          <option v-for="acc in checkingAccounts" :key="acc.iban" :value="acc.iban">
            {{ acc.userFullName }} ({{ acc.iban }}) - €{{ acc.balance.toFixed(2) }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Destination Account (Customer & IBAN)</label>
        <select v-model="selectedDestination" required>
          <option value="" disabled>Select destination account</option>
          <option v-for="acc in checkingAccounts" :key="acc.iban + '-dest'" :value="acc.iban" :disabled="acc.iban === selectedSource">
            {{ acc.userFullName }} ({{ acc.iban }})
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount (€)</label>
        <input type="number" v-model.number="amount" min="0.01" step="0.01" required />
      </div>
      <button type="submit" class="transfer-btn">Transfer</button>
    </form>

    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAllCustomers, getCustomerAccounts, createEmployeeTransfer } from '@/services/employeeApi';

const loading = ref(true);
const error = ref(null);
const successMessage = ref('');
const customers = ref([]);
const checkingAccounts = ref([]);
const selectedSource = ref('');
const selectedDestination = ref('');
const amount = ref(null);

const fetchAllCheckingAccounts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const custRes = await getAllCustomers();
    customers.value = custRes.data;
    const allAccounts = [];
    for (const customer of customers.value) {
      const accRes = await getCustomerAccounts(customer.id);
      const checking = accRes.data.filter(acc => acc.accountType === 'CHECKING' && acc.active);
      checking.forEach(acc => {
        allAccounts.push({
          ...acc,
          userFullName: customer.firstName + ' ' + customer.lastName
        });
      });
    }
    checkingAccounts.value = allAccounts;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load accounts.';
  } finally {
    loading.value = false;
  }
};

const handleTransfer = async () => {
  error.value = '';
  successMessage.value = '';
  const source = checkingAccounts.value.find(acc => acc.iban === selectedSource.value);
  if (!source) {
    error.value = 'Invalid source account.';
    return;
  }
  if (amount.value <= 0) {
    error.value = 'Amount must be positive.';
    return;
  }
  try {
    await createEmployeeTransfer({
      fromIban: selectedSource.value,
      toIban: selectedDestination.value,
      amount: amount.value
    });
    successMessage.value = 'Transfer successful!';
    await fetchAllCheckingAccounts();
    selectedSource.value = '';
    selectedDestination.value = '';
    amount.value = null;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Transfer failed.';
  }
};

onMounted(() => {
  fetchAllCheckingAccounts();
});
</script>

<style scoped>
.employee-transfer {
  padding: 20px;
  border: 1px solid #eee;
  margin-top: 10px;
  max-width: 600px;
}
.form-group {
  margin-bottom: 16px;
}
label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
select, input[type="number"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.transfer-btn {
  padding: 10px 20px;
  background: #2196f3;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.transfer-btn:hover {
  background: #1976d2;
}
.loading-message {
  background: #e3f2fd;
  color: #1976d2;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.success-message {
  background: #e8f5e9;
  color: #388e3c;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}
</style> 