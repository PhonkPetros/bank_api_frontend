<template>
  <div class="atm-page">
    <h2>ATM</h2>
    <div v-if="loading" class="loading-message">Loading accounts...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="account">
      <p><strong>Account:</strong> {{ account.iban }} ({{ account.accountType }})</p>
      <p><strong>Balance:</strong> €{{ account.balance.toFixed(2) }}</p>
      <p><strong>Daily Limit:</strong> €{{ account.dailyLimit.toFixed(2) }}</p>
      <p><strong>Daily Transfer Limit:</strong> €{{ account.dailyTransferLimit.toFixed(2) }}</p>
      <form @submit.prevent="handleDeposit">
        <label>Deposit Amount (€):</label>
        <input 
          type="number" 
          v-model.number="depositAmount" 
          min="0.01" 
          max="999999999"
          step="0.01" 
          required 
          @input="sanitizeInput('deposit')"
          @keypress="preventInvalidChars"
        />
        <button type="submit" :disabled="loading">Deposit</button>
      </form>
      <form @submit.prevent="handleWithdraw">
        <label>Withdraw Amount (€):</label>
        <input 
          type="number" 
          v-model.number="withdrawAmount" 
          min="0.01" 
          max="999999999"
          step="0.01" 
          required 
          @input="sanitizeInput('withdraw')"
          @keypress="preventInvalidChars"
        />
        <button type="submit" :disabled="loading">Withdraw</button>
      </form>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    </div>
    <div v-else-if="!loading && !error">
      <p>No checking account available for ATM operations.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCustomerAccounts, atmDeposit, atmWithdraw } from '@/services/customerApi';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const error = ref('');
const successMessage = ref('');
const account = ref(null);
const depositAmount = ref(null);
const withdrawAmount = ref(null);

const fetchAccounts = async () => {
  loading.value = true;
  error.value = '';
  try {
    console.log('Fetching accounts...')
    console.log('Current token:', localStorage.getItem('token'))
    const response = await getCustomerAccounts()
    console.log('Full response from getCustomerAccounts:', JSON.stringify(response.data, null, 2))
    if (response && response.data) {
      // Find the first active checking account
      console.log('Searching for active checking account...');
      account.value = response.data.find(acc => {
        console.log('Checking account:', {
          iban: acc.iban,
          type: acc.accountType,
          active: acc.active,
          rawAccount: acc
        });
        const isChecking = acc.accountType === 'CHECKING';
        const isActive = acc.active === true;
        console.log('Account check:', { isChecking, isActive });
        return isChecking && isActive;
      });
      
      if (!account.value) {
        console.log('No active checking account found. All accounts received:', JSON.stringify(response.data, null, 2))
        error.value = 'No active checking account found for ATM operations.'
      } else {
        console.log('Found active checking account:', account.value);
      }
    } else {
      error.value = 'Failed to retrieve account data.'
    }
  } catch (error) {
    console.error('Error fetching account for ATM:', error)
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers
    })
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - Token may be invalid or expired')
      // Clear storage and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    error.value = 'Failed to fetch account information. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleDeposit = async () => {
  if (!account.value) return;
  
  error.value = '';
  successMessage.value = '';
  loading.value = true;
  
  // Enhanced validation
  if (!depositAmount.value || isNaN(depositAmount.value) || !isFinite(depositAmount.value)) {
    error.value = 'Please enter a valid number.';
    loading.value = false;
    return;
  }
  
  if (depositAmount.value <= 0) {
    error.value = 'Amount must be positive.';
    loading.value = false;
    return;
  }
  
  if (depositAmount.value > 999999999) {
    error.value = 'Amount is too large. Maximum deposit is €999,999,999.';
    loading.value = false;
    return;
  }
  
  // Round to 2 decimal places to prevent precision issues
  depositAmount.value = Math.round(depositAmount.value * 100) / 100;
  
  try {
    await atmDeposit(account.value.iban, depositAmount.value);
    await fetchAccounts(); // Refresh account data
    successMessage.value = `Deposited €${depositAmount.value.toFixed(2)} successfully!`;
    depositAmount.value = null;
  } catch (err) {
    if (err.response?.status === 403) {
      // Handle 403 Forbidden (unlikely for deposits, but for consistency)
      error.value = err.response.data || 'Deposit not allowed.';
    } else if (err.response?.status === 400) {
      // Handle 400 Bad Request (validation errors)
      error.value = err.response.data || 'Invalid deposit request.';
    } else if (err.response?.data) {
      // Handle other HTTP errors with response data
      if (typeof err.response.data === 'string') {
        error.value = err.response.data;
      } else if (err.response.data.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Deposit failed.';
      }
    } else {
      // Handle network errors or other issues
      error.value = err.message || 'Deposit failed.';
    }
  } finally {
    loading.value = false;
  }
};

const handleWithdraw = async () => {
  if (!account.value) return;
  
  error.value = '';
  successMessage.value = '';
  loading.value = true;
  
  // Enhanced validation
  if (!withdrawAmount.value || isNaN(withdrawAmount.value) || !isFinite(withdrawAmount.value)) {
    error.value = 'Please enter a valid number.';
    loading.value = false;
    return;
  }
  
  if (withdrawAmount.value <= 0) {
    error.value = 'Amount must be positive.';
    loading.value = false;
    return;
  }
  
  if (withdrawAmount.value > 999999999) {
    error.value = 'Amount is too large. Maximum withdrawal is €999,999,999.';
    loading.value = false;
    return;
  }
  
  // Round to 2 decimal places to prevent precision issues
  withdrawAmount.value = Math.round(withdrawAmount.value * 100) / 100;
  
  try {
    await atmWithdraw(account.value.iban, withdrawAmount.value);
    await fetchAccounts(); // Refresh account data
    successMessage.value = `Withdrew €${withdrawAmount.value.toFixed(2)} successfully!`;
    withdrawAmount.value = null;
  } catch (err) {
    if (err.response?.status === 403) {
      // Handle 403 Forbidden (limit exceeded)
      error.value = err.response.data || 'Daily withdrawal limit exceeded.';
    } else if (err.response?.status === 400) {
      // Handle 400 Bad Request (validation errors)
      error.value = err.response.data || 'Invalid withdrawal request.';
    } else if (err.response?.data) {
      // Handle other HTTP errors with response data
      if (typeof err.response.data === 'string') {
        error.value = err.response.data;
      } else if (err.response.data.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Withdrawal failed.';
      }
    } else {
      // Handle network errors or other issues
      error.value = err.message || 'Withdrawal failed.';
    }
  } finally {
    loading.value = false;
  }
};

// Input sanitization helpers
const sanitizeInput = (type) => {
  const value = type === 'deposit' ? depositAmount.value : withdrawAmount.value;
  if (value !== null && value !== undefined) {
    // Remove any non-numeric characters except decimal point
    const sanitized = parseFloat(value);
    if (!isNaN(sanitized) && isFinite(sanitized)) {
      if (type === 'deposit') {
        depositAmount.value = sanitized;
      } else {
        withdrawAmount.value = sanitized;
      }
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
  fetchAccounts();
});
</script>

<style scoped>
.atm-page {
  max-width: 500px;
  margin: 40px auto;
  padding: 24px;
  background: #f5f5f5;
  border-radius: 8px;
}
h2 {
  margin-bottom: 24px;
  color: #1976d2;
}
form {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: 500;
}
input[type="number"] {
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
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
}
button:hover:not(:disabled) {
  background: #1565c0;
}
button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.loading-message {
  background: #e3f2fd;
  color: #1976d2;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
}
.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
}
.success-message {
  background: #e8f5e9;
  color: #388e3c;
  padding: 12px;
  border-radius: 4px;
  margin-top: 16px;
  text-align: center;
}
p {
  margin: 8px 0;
  font-size: 16px;
}
strong {
  color: #333;
}
</style> 