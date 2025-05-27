<template>
  <div class="customer-management">
    <h2>Customer Management</h2>

    <!-- Loading and Error States -->
    <div v-if="loading" class="loading-message">
      Loading customers...
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Customer List -->
    <div v-if="!loading && !error && customers.length > 0" class="customers-section">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>BSN</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in customers" :key="customer.id">
            <td>{{ customer.firstName }} {{ customer.lastName }}</td>
            <td>{{ customer.email }}</td>
            <td>{{ customer.bsn }}</td>
            <td>{{ customer.phone }}</td>
            <td>
              <button @click="viewCustomerDetails(customer)" class="view-btn">
                View Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && !error && customers.length === 0" class="no-customers-message">
      No customers found.
    </div>

    <!-- Customer Details Modal -->
    <div v-if="selectedCustomer" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Customer Details</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <div class="customer-info">
          <h4>{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</h4>
          <p>Email: {{ selectedCustomer.email }}</p>
          <p>BSN: {{ selectedCustomer.bsn }}</p>
          <p>Phone: {{ selectedCustomer.phone }}</p>
        </div>

        <!-- Error message display inside modal -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Accounts Section -->
        <div class="accounts-section">
          <h4>Accounts</h4>
          <div v-if="loadingAccounts" class="loading-message">Loading accounts...</div>
          <div v-else-if="accounts.length === 0" class="no-accounts-message">
            No accounts found for this customer.
          </div>
          <table v-else class="accounts-table">
            <thead>
              <tr>
                <th>IBAN</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Absolute Limit</th>
                <th>Daily Limit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in accounts" :key="account.iban">
                <td>{{ account.iban }}</td>
                <td>{{ account.accountType }}</td>
                <td>€{{ account.balance.toFixed(2) }}</td>
                <td>€{{ account.absoluteLimit.toFixed(2) }}</td>
                <td>€{{ account.dailyLimit.toFixed(2) }}</td>
                <td>{{ account.active ? 'Active' : 'Inactive' }}</td>
                <td>
                  <button 
                    @click="handleUpdateAccountLimits(account)"
                    class="update-btn"
                  >
                    Update Limits
                  </button>
                  <button 
                    v-if="account.active"
                    @click="closeAccount(account.iban)"
                    class="close-account-btn"
                  >
                    Close Account
                  </button>
                  <button 
                    v-if="!account.active"
                    @click="reopenAccount(account.iban)"
                    class="reopen-account-btn"
                  >
                    Reopen Account
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Transactions Section -->
        <div class="transactions-section">
          <h4>Recent Transactions</h4>
          <div v-if="loadingTransactions" class="loading-message">Loading transactions...</div>
          <div v-else-if="transactions.length === 0" class="no-transactions-message">
            No transactions found for this customer.
          </div>
          <table v-else class="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Initiated By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in transactions" :key="transaction.id">
                <td>{{ formatDate(transaction.timestamp) }}</td>
                <td>
                  <span class="truncate clickable" :title="transaction.fromIban" @click="showPopup(transaction.fromIban, 'From IBAN')">{{ transaction.fromIban || '-' }}</span>
                </td>
                <td>
                  <span class="truncate clickable" :title="transaction.toIban" @click="showPopup(transaction.toIban, 'To IBAN')">{{ transaction.toIban || '-' }}</span>
                </td>
                <td :class="amountClass(transaction) + ' amount-cell'">
                  <span v-if="amountClass(transaction) === 'amount-positive'">+</span>
                  <span v-else-if="amountClass(transaction) === 'amount-negative'">-</span>
                  €{{ transaction.amount.toFixed(2) }}
                </td>
                <td>{{ transaction.transactionType }}</td>
                <td>
                  <span class="truncate clickable" :title="transaction.initiatedByFullName" @click="showPopup(transaction.initiatedByFullName, 'Initiated By')">{{ transaction.initiatedByFullName || '-' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- Click-to-expand popup -->
          <div v-if="popup.visible" class="expand-popup-overlay" @click.self="closePopup">
            <div class="expand-popup">
              <div class="popup-header">
                <span class="popup-title">{{ popup.label }}</span>
                <button class="popup-close" @click="closePopup">&times;</button>
              </div>
              <div class="popup-value">{{ popup.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Limits Modal -->
    <div v-if="showLimitsModal" class="modal-overlay" @click="closeLimitsModal">
      <div class="modal-content limits-modal" @click.stop>
        <div class="modal-header">
          <h3>Update Account Limits</h3>
          <button @click="closeLimitsModal" class="close-btn">&times;</button>
        </div>
        <div class="limits-form">
          <div class="form-group">
            <label>Absolute Limit (€)</label>
            <input 
              type="number" 
              v-model="newLimits.absoluteLimit"
              min="0"
              step="0.01"
            />
          </div>
          <div class="form-group">
            <label>Daily Limit (€)</label>
            <input 
              type="number" 
              v-model="newLimits.dailyLimit"
              min="0"
              step="0.01"
            />
          </div>
          <div class="form-group">
            <label>Daily Transfer Limit (€)</label>
            <input 
              type="number" 
              v-model="newLimits.dailyTransferLimit"
              min="0"
              step="0.01"
            />
          </div>
          <div class="form-actions">
            <button @click="saveNewLimits" class="save-btn">Save</button>
            <button @click="closeLimitsModal" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  getAllCustomers, 
  getCustomerAccounts, 
  getAccountTransactionsForEmployee,
  updateAccountLimits,
  closeAccountByEmployee,
  searchCustomersByName,
  reopenAccountByEmployee
} from '@/services/employeeApi';

const customers = ref([]);
const loading = ref(false);
const error = ref(null);

// Customer details modal
const selectedCustomer = ref(null);
const accounts = ref([]);
const transactions = ref([]);
const loadingAccounts = ref(false);
const loadingTransactions = ref(false);

// Limits update modal
const showLimitsModal = ref(false);
const selectedAccount = ref(null);
const newLimits = ref({
  absoluteLimit: 0,
  dailyLimit: 0,
  dailyTransferLimit: 0
});

const customerIbans = computed(() => {
  if (!accounts.value || !accounts.value.length) return [];
  return accounts.value.map(acc => acc.iban);
});

const popup = ref({ visible: false, value: '', label: '' });

function amountClass(transaction) {
  // If no selected customer or accounts, return empty
  if (!selectedCustomer.value || !customerIbans.value.length) return '';
  // Incoming: toIban is one of the customer's accounts
  if (customerIbans.value.includes(transaction.toIban)) {
    return 'amount-positive';
  }
  // Outgoing: fromIban is one of the customer's accounts
  if (customerIbans.value.includes(transaction.fromIban)) {
    return 'amount-negative';
  }
  return '';
}

const fetchCustomers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await getAllCustomers();
    customers.value = response.data;
  } catch (err) {
    console.error('Failed to fetch customers:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to fetch customers.';
  } finally {
    loading.value = false;
  }
};

const viewCustomerDetails = async (customer) => {
  selectedCustomer.value = customer;
  error.value = null;
  await Promise.all([
    fetchCustomerAccounts(customer.id),
    fetchCustomerTransactions(customer.id)
  ]);
};

const fetchCustomerAccounts = async (customerId) => {
  loadingAccounts.value = true;
  try {
    const response = await getCustomerAccounts(customerId);
    accounts.value = response.data;
  } catch (err) {
    console.error('Failed to fetch customer accounts:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to fetch accounts.';
  } finally {
    loadingAccounts.value = false;
  }
};

const fetchCustomerTransactions = async (customerId) => {
  loadingTransactions.value = true;
  try {
    // First get all customer accounts
    const accountsResponse = await getCustomerAccounts(customerId);
    const customerAccounts = accountsResponse.data;
    
    // Then get transactions for each account
    const allTransactions = [];
    for (const account of customerAccounts) {
      const transactionsResponse = await getAccountTransactionsForEmployee(account.iban);
      allTransactions.push(...transactionsResponse.data);
    }
    
    // Sort transactions by timestamp (most recent first)
    transactions.value = allTransactions.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (err) {
    console.error('Failed to fetch customer transactions:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to fetch transactions.';
  } finally {
    loadingTransactions.value = false;
  }
};

const handleUpdateAccountLimits = (account) => {
  selectedAccount.value = account;
  newLimits.value = {
    absoluteLimit: account.absoluteLimit,
    dailyLimit: account.dailyLimit,
    dailyTransferLimit: account.dailyTransferLimit
  };
  showLimitsModal.value = true;
};

const saveNewLimits = async () => {
  if (!selectedAccount.value) return;

  try {
    const limitUpdateRequest = {
      absoluteLimit: Number(newLimits.value.absoluteLimit),
      dailyLimit: Number(newLimits.value.dailyLimit),
      dailyTransferLimit: Number(newLimits.value.dailyTransferLimit)
    };
    
    await updateAccountLimits(selectedAccount.value.iban, limitUpdateRequest);
    // Refresh accounts list
    await fetchCustomerAccounts(selectedCustomer.value.id);
    closeLimitsModal();
  } catch (err) {
    console.error('Failed to update account limits:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to update limits.';
  }
};

const closeAccount = async (iban) => {
  // Find the account to show balance in confirmation
  const account = accounts.value.find(acc => acc.iban === iban);
  const balance = account ? account.balance.toFixed(2) : '0.00';
  
  let confirmMessage = `Are you sure you want to close account ${iban}?`;
  if (account && account.balance !== 0) {
    confirmMessage = `Account ${iban} has a balance of €${balance}. The account balance must be zero before closing. Do you want to proceed anyway?`;
  } else {
    confirmMessage = `Are you sure you want to close account ${iban}? (Balance: €${balance})`;
  }
  
  if (!confirm(confirmMessage)) return;

  try {
    await closeAccountByEmployee(iban);
    // Refresh accounts list
    await fetchCustomerAccounts(selectedCustomer.value.id);
    // Clear any previous errors on success
    error.value = null;
  } catch (err) {
    console.error('Failed to close account:', err);
    console.error('Error response:', err.response);
    console.error('Error status:', err.response?.status);
    console.error('Error data:', err.response?.data);
    
    // Handle different types of errors
    if (err.response?.status === 400) {
      // Handle 400 Bad Request specifically
      const errorMessage = err.response.data;
      if (typeof errorMessage === 'string' && (errorMessage.includes('balance must be zero') || errorMessage.includes('Current balance:'))) {
        // Extract balance from error message if possible
        const balanceMatch = errorMessage.match(/Current balance: ([\d.]+)/);
        const currentBalance = balanceMatch ? `€${parseFloat(balanceMatch[1]).toFixed(2)}` : 'a non-zero amount';
        
        error.value = `Cannot close account due to existing balance of ${currentBalance}. Please transfer all funds to another account before closing.`;
      } else {
        error.value = errorMessage || 'Failed to close account due to validation error.';
      }
    } else if (err.response?.status === 500) {
      // Handle 500 Internal Server Error
      error.value = 'An unexpected server error occurred while closing the account. Please try again later.';
    } else if (err.response?.data) {
      // Handle other HTTP errors with response data
      if (typeof err.response.data === 'string') {
        error.value = err.response.data;
      } else if (err.response.data.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Failed to close account.';
      }
    } else {
      // Handle network errors or other issues
      error.value = err.message || 'Failed to close account. Please check your connection and try again.';
    }
    
    console.log('Final error message set:', error.value);
  }
};

const reopenAccount = async (iban) => {
  try {
    await reopenAccountByEmployee(iban);
    await fetchCustomerAccounts(selectedCustomer.value.id);
  } catch (err) {
    console.error('Failed to reopen account:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to reopen account.';
  }
};

const closeModal = () => {
  selectedCustomer.value = null;
  accounts.value = [];
  transactions.value = [];
  error.value = null;
};

const closeLimitsModal = () => {
  showLimitsModal.value = false;
  selectedAccount.value = null;
  newLimits.value = {
    absoluteLimit: 0,
    dailyLimit: 0,
    dailyTransferLimit: 0
  };
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

function showPopup(value, label) {
  if (!value) return;
  popup.value = { visible: true, value, label };
}

function closePopup() {
  popup.value = { visible: false, value: '', label: '' };
}

onMounted(() => {
  fetchCustomers();
});
</script>

<style scoped>
.customer-management {
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
  border: 1px solid #f5c6cb;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
}

.no-customers-message {
  background-color: #f5f5f5;
  color: #616161;
}

.customers-table,
.accounts-table,
.transactions-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.customers-table th,
.customers-table td,
.accounts-table th,
.accounts-table td,
.transactions-table th,
.transactions-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.customers-table th,
.accounts-table th,
.transactions-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #424242;
}

.view-btn,
.update-btn,
.close-account-btn,
.reopen-account-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  font-size: 14px;
}

.view-btn {
  background-color: #2196f3;
  color: white;
}

.update-btn {
  background-color: #4caf50;
  color: white;
}

.close-account-btn {
  background-color: #f44336;
  color: white;
}

.reopen-account-btn {
  background-color: #ffb300;
  color: white;
}

.reopen-account-btn:hover {
  background-color: #ffa000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.customer-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.accounts-section,
.transactions-section {
  margin-top: 20px;
}

.limits-modal {
  max-width: 500px;
}

.limits-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #424242;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.save-btn,
.cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.cancel-btn {
  background-color: #9e9e9e;
  color: white;
}

.amount-positive {
  color: #388e3c;
  font-weight: 600;
}
.amount-negative {
  color: #c62828;
  font-weight: 600;
}

.transactions-table th, .transactions-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
}
.amount-cell {
  text-align: right;
  min-width: 120px;
}
.truncate {
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.clickable {
  cursor: pointer;
  text-decoration: underline dotted #1976d2;
}
.transactions-table tr:hover {
  background: #f0f7ff;
}
.expand-popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.expand-popup {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 24px #1976d220;
  padding: 24px 32px;
  min-width: 260px;
  max-width: 90vw;
  word-break: break-all;
  font-size: 1.1rem;
  position: relative;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.popup-title {
  font-weight: 600;
  color: #1976d2;
  font-size: 1.05rem;
}
.popup-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  margin-left: 12px;
}
.popup-close:hover {
  color: #c62828;
}
.popup-value {
  font-family: 'Fira Mono', 'Consolas', monospace;
  color: #222;
  font-size: 1.08rem;
  word-break: break-all;
}
@media (max-width: 900px) {
  .transactions-table th, .transactions-table td {
    max-width: 90px;
    font-size: 13px;
    padding: 8px;
  }
  .truncate {
    max-width: 70px;
  }
  .amount-cell {
    min-width: 80px;
  }
}
</style> 