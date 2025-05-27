<template>
  <div class="transfer-container">
    <h2>Make a Transfer</h2>
    
    <!-- Error message display -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Success message display -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- Transfer Type Selection -->
    <div class="form-group">
      <label for="transfer-type">Transfer Type:</label>
      <select v-model="transferType" @change="onTransferTypeChange">
        <option value="own">Between My Accounts</option>
        <option value="other">To Other Person</option>
      </select>
    </div>

    <!-- From Account (always shown) -->
    <div class="form-group">
      <label for="from-iban">From Account:</label>
      <select v-model="fromIban" @change="onFromIbanChange">
        <option value="">Select account...</option>
        <option v-for="account in ownAccounts" :key="account.iban" :value="account.iban">
          {{ account.iban }} - {{ account.accountType }} (€{{ account.balance?.toFixed(2) || '0.00' }})
        </option>
      </select>
    </div>

    <!-- To Account for Own Transfers -->
    <div v-if="transferType === 'own'" class="form-group">
      <label for="to-iban-own">To Account:</label>
      <select v-model="toIban" @change="onToIbanChange">
        <option value="">Select destination account...</option>
        <option v-for="account in availableToAccounts" :key="account.iban" :value="account.iban">
          {{ account.iban }} - {{ account.accountType }} (€{{ account.balance?.toFixed(2) || '0.00' }})
        </option>
      </select>
    </div>

    <!-- Recipient Search for Other Transfers -->
    <div v-if="transferType === 'other'" class="form-group">
      <label for="recipient-query">Search Recipient (First Last):</label>
      <input 
        type="text" 
        v-model="recipientQuery" 
        @input="onRecipientQueryInput" 
        placeholder="Enter first and last name"
      />
    </div>

    <!-- To Account for Other Transfers -->
    <div v-if="transferType === 'other' && recipientSuggestions.length > 0" class="form-group">
      <label for="to-iban">Recipient Account:</label>
      <select v-model="toIban" @change="onToIbanChange">
        <option value="">Select recipient account...</option>
        <option v-for="suggestion in recipientSuggestions" :key="suggestion.iban" :value="suggestion.iban">
          {{ suggestion.iban }} - {{ suggestion.firstName }} {{ suggestion.lastName }}
        </option>
      </select>
    </div>

    <!-- Amount -->
    <div class="form-group">
      <label for="amount">Amount (€):</label>
      <input 
        type="number" 
        v-model="amount" 
        step="0.01" 
        min="0.01"
        max="999999999"
        placeholder="0.00"
        @input="sanitizeAmountInput"
        @keypress="preventInvalidChars"
      />
    </div>

    <button @click="handleTransfer" :disabled="loading">
      {{ loading ? 'Processing...' : 'Transfer' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getCustomerAccounts, customerTransfer, searchCustomerIbans } from '@/services/customerApi';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const ownAccounts = ref([]);
const fromIban = ref('');
const toIban = ref('');
const amount = ref(null);

const transferType = ref('own'); // 'own' or 'other'
const recipientQuery = ref('');
const recipientSuggestions = ref([]);

// Computed property to get available destination accounts (excluding the selected from account)
const availableToAccounts = computed(() => {
  return ownAccounts.value.filter(account => account.iban !== fromIban.value);
});

const fetchOwnAccounts = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getCustomerAccounts();
    ownAccounts.value = res.data;
    console.log('Loaded accounts:', ownAccounts.value);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load accounts.';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

const handleTransfer = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  
  try {
    const response = await axios.post('/customer/transactions/transfer', {
      fromIban: fromIban.value,
      toIban: toIban.value,
      amount: parseFloat(amount.value)
    });
    
    successMessage.value = `Transfer of €${amount.value} successful!`;
    error.value = '';
    resetForm();
    // Refresh account data to show updated balances
    await fetchOwnAccounts();
  } catch (err) {
    console.log('Transfer error:', err);
    
    if (err.response?.status === 403) {
      // Handle 403 Forbidden (limit exceeded)
      error.value = err.response.data || 'Transfer not allowed due to limits.';
    } else if (err.response?.status === 400) {
      // Handle 400 Bad Request (validation errors)
      error.value = err.response.data || 'Invalid transfer request.';
    } else if (err.response?.data) {
      // Handle other HTTP errors with response data
      if (typeof err.response.data === 'string') {
        error.value = err.response.data;
      } else if (err.response.data.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Transfer failed.';
      }
    } else {
      // Handle network errors or other issues
      error.value = err.message || 'Transfer failed.';
    }
    successMessage.value = '';
  } finally {
    loading.value = false;
  }
};

const onTransferTypeChange = () => {
  // Reset form when transfer type changes
  toIban.value = '';
  recipientQuery.value = '';
  recipientSuggestions.value = [];
  error.value = '';
  successMessage.value = '';
};

const onFromIbanChange = () => {
  // Reset destination when from account changes
  if (transferType.value === 'own') {
    toIban.value = '';
  }
  error.value = '';
  successMessage.value = '';
};

const onRecipientQueryInput = async () => {
  if (recipientQuery.value.length < 3) {
    recipientSuggestions.value = [];
    return;
  }

  try {
    const names = recipientQuery.value.trim().split(' ');
    if (names.length >= 2) {
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');
      
      const results = await searchCustomerIbans(firstName, lastName);
      recipientSuggestions.value = results;
    }
  } catch (err) {
    console.error('Error searching recipients:', err);
    recipientSuggestions.value = [];
  }
};

const onToIbanChange = () => {
  error.value = '';
  successMessage.value = '';
};

const validateForm = () => {
  if (!fromIban.value) {
    error.value = 'Please select a source account';
    return false;
  }
  if (!toIban.value) {
    error.value = 'Please select a destination account';
    return false;
  }
  if (fromIban.value === toIban.value) {
    error.value = 'Cannot transfer from an account to itself';
    return false;
  }
  
  // Enhanced amount validation
  if (!amount.value) {
    error.value = 'Please enter an amount';
    return false;
  }
  
  if (isNaN(amount.value) || !isFinite(amount.value)) {
    error.value = 'Please enter a valid number';
    return false;
  }
  
  if (amount.value <= 0) {
    error.value = 'Please enter a valid amount greater than 0';
    return false;
  }
  
  if (amount.value > 999999999) {
    error.value = 'Amount is too large. Maximum transfer is €999,999,999';
    return false;
  }
  
  // Round to 2 decimal places to prevent precision issues
  amount.value = Math.round(amount.value * 100) / 100;
  
  return true;
};

const resetForm = () => {
  fromIban.value = '';
  toIban.value = '';
  amount.value = null;
  recipientQuery.value = '';
  recipientSuggestions.value = [];
};

const sanitizeAmountInput = () => {
  if (amount.value !== null && amount.value !== undefined) {
    // Remove any non-numeric characters except decimal point
    const sanitized = parseFloat(amount.value);
    if (!isNaN(sanitized) && isFinite(sanitized)) {
      amount.value = sanitized;
    }
  }
};

const preventInvalidChars = (event) => {
  // Allow: backspace, delete, tab, escape, enter, decimal point
  if ([46, 8, 9, 27, 13, 110, 190].indexOf(event.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true)) {
    return;
  }
  // Ensure that it is a number and stop the keypress
  if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
    event.preventDefault();
  }
};

onMounted(() => {
  fetchOwnAccounts();
});
</script>

<style scoped>
.transfer-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 24px;
  color: #1976d2;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

select, input[type="number"], input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

select:focus, input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

button {
  width: 100%;
  padding: 12px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 20px;
}

button:hover:not(:disabled) {
  background: #1565c0;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 12px;
  margin: 16px 0;
  border-radius: 4px;
  text-align: center;
}

.success-message {
  color: #28a745;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 12px;
  margin: 16px 0;
  border-radius: 4px;
  text-align: center;
}

option {
  padding: 8px;
}

input[type="number"] {
  text-align: right;
}

/* Responsive design */
@media (max-width: 768px) {
  .transfer-container {
    margin: 20px;
    padding: 16px;
  }
}
</style> 