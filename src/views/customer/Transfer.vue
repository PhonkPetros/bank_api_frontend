<template>
  <div class="transfer-container">
    <div class="transfer-card">
      <h2>
        <span class="icon">💸</span> Transfer Money
      </h2>
      <form @submit.prevent="handleTransfer" class="transfer-form" v-if="!loading">
        <div class="form-group">
          <label for="fromIban">From Account</label>
          <select v-model="fromIban" id="fromIban" required>
            <option value="" disabled>Select account</option>
            <option v-for="acc in ownAccounts" :key="acc.iban" :value="acc.iban">
              {{ acc.accountType }} ({{ acc.iban }}) - €{{ acc.balance.toFixed(2) }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Transfer To</label>
          <div class="tab-row">
            <button type="button" :class="{active: transferType==='own'}" @click="transferType='own'">My Savings</button>
            <button type="button" :class="{active: transferType==='other'}" @click="transferType='other'">Other Customer</button>
          </div>
        </div>
        <div v-if="transferType==='own'" class="form-group">
          <label for="toIbanOwn">To Savings Account</label>
          <select v-model="toIban" id="toIbanOwn" required>
            <option value="" disabled>Select savings account</option>
            <option v-for="acc in ownSavings" :key="acc.iban" :value="acc.iban">
              {{ acc.accountType }} ({{ acc.iban }}) - €{{ acc.balance.toFixed(2) }}
            </option>
          </select>
        </div>
        <div v-if="transferType==='other'" class="form-group recipient-form-group" :class="{ 'has-suggestions': recipientSuggestions.length > 0 || searchLoading || (recipientQuery.length >= 2 && !searchLoading && recipientSuggestions.length === 0) }">
          <div class="input-icon recipient-autocomplete">
            <input
              v-model="recipientQuery"
              id="toIbanOther"
              placeholder=" "
              @input="searchRecipients"
              autocomplete="off"
              required
              @focus="recipientFocused = true"
              @blur="handleBlur"
              @keydown.down.prevent="moveSuggestion(1)"
              @keydown.up.prevent="moveSuggestion(-1)"
              @keydown.enter.prevent="selectActiveSuggestion"
              class="modern-input"
            />
            <label for="toIbanOther" class="floating-label" :class="{focused: recipientFocused || recipientQuery}">
              Enter IBAN or Full Name (First Last)
            </label>
            <span class="search-icon">🔍</span>
            <transition name="fade">
              <ul v-if="recipientSuggestions.length > 0" class="suggestions-list modern-dropdown">
                <li v-for="(suggestion, idx) in recipientSuggestions" :key="suggestion.iban"
                    :class="{active: idx === activeSuggestionIndex}"
                    @mousedown.prevent="selectRecipient(suggestion)"
                    @mouseover="activeSuggestionIndex = idx">
                  <span class="suggestion-name">{{ suggestion.accountHolderName }}</span>
                  <span class="suggestion-iban">{{ suggestion.iban }}</span>
                </li>
              </ul>
              <div v-else-if="searchLoading" class="suggestions-list modern-dropdown">
                <li class="loading-suggestion">
                  <span class="spinner-small"></span> Searching...
                </li>
              </div>
              <div v-else-if="recipientQuery.length === 1" class="suggestions-list modern-dropdown">
                <li class="hint-message non-clickable">
                  💡 Enter first and last name for better search results
                </li>
              </div>
              <div v-else-if="recipientQuery.length >= 2 && !searchLoading && recipientSuggestions.length === 0" class="suggestions-list modern-dropdown">
                <li class="no-results non-clickable">
                  No recipients found. Try entering a complete IBAN or full name (first and last name).
                </li>
              </div>
            </transition>
          </div>
        </div>
        <div class="form-group">
          <label for="amount">Amount</label>
          <div class="input-icon">
            <span class="euro">€</span>
            <input type="number" v-model.number="amount" id="amount" min="0.01" step="0.01" placeholder="0.00" required />
          </div>
        </div>
        <button type="submit" :disabled="transferLoading">Transfer</button>
      </form>
      <div v-if="loading" class="loading-message">
        <span class="spinner"></span> Loading accounts...
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="successMessage" class="success-message">
        <span class="checkmark">✔</span> {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getCustomerAccounts, customerTransfer, searchCustomerIbans } from '@/services/customerApi';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const transferLoading = ref(false);
const error = ref('');
const successMessage = ref('');
const ownAccounts = ref([]);
const fromIban = ref('');
const toIban = ref('');
const amount = ref(null);

const transferType = ref('own'); // 'own' or 'other'
const recipientQuery = ref('');
const recipientSuggestions = ref([]);
const recipientFocused = ref(false);
const activeSuggestionIndex = ref(-1);
const searchLoading = ref(false);

const ownSavings = computed(() => ownAccounts.value.filter(acc => acc.accountType === 'SAVINGS'));
const ownChecking = computed(() => ownAccounts.value.filter(acc => acc.accountType === 'CHECKING'));

const fetchOwnAccounts = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getCustomerAccounts();
    ownAccounts.value = res.data;
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

const searchRecipients = async () => {
  console.log('searchRecipients called with query:', recipientQuery.value);
  activeSuggestionIndex.value = -1;
  
  // Clear previous suggestions if query is too short
  if (recipientQuery.value.trim().length < 2) {
    console.log('Query too short, clearing suggestions');
    recipientSuggestions.value = [];
    toIban.value = '';
    searchLoading.value = false;
    return;
  }
  
  // If the query looks like an IBAN, don't search by name
  const ibanRegex = /^NL\d{2}[A-Z]{4}\d{10}$/i;
  if (ibanRegex.test(recipientQuery.value.trim())) {
    console.log('Query looks like IBAN, setting directly');
    recipientSuggestions.value = [];
    toIban.value = recipientQuery.value.trim().toUpperCase();
    searchLoading.value = false;
    return;
  }
  
  // Search by name - be more flexible with requirements
  const parts = recipientQuery.value.trim().split(' ');
  console.log('Query parts:', parts);
  
  // Allow search with just first name or first + last name
  if (parts.length >= 1 && parts[0].length >= 2) {
    searchLoading.value = true;
    try {
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
      
      console.log('Making API call - Searching for firstName:', firstName, 'lastName:', lastName);
      const results = await searchCustomerIbans(firstName, lastName);
      console.log('API call successful - Search results:', results);
      
      // Only update suggestions if this is still the current query
      if (recipientQuery.value.trim() === (firstName + (lastName ? ' ' + lastName : '')).trim()) {
        recipientSuggestions.value = results || [];
        console.log('Updated suggestions:', recipientSuggestions.value);
        
        // Clear toIban when searching to force user to select from suggestions
        if (!toIban.value || !results.some(r => r.iban === toIban.value)) {
          toIban.value = '';
        }
      }
    } catch (e) {
      console.error('API call failed - Search error:', e);
      console.error('Error details:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message
      });
      recipientSuggestions.value = [];
    } finally {
      searchLoading.value = false;
    }
  } else {
    console.log('Query too short for name search');
    recipientSuggestions.value = [];
    toIban.value = '';
    searchLoading.value = false;
  }
};

const selectRecipient = (suggestion) => {
  toIban.value = suggestion.iban;
  recipientQuery.value = `${suggestion.accountHolderName} (${suggestion.iban})`;
  recipientSuggestions.value = [];
  activeSuggestionIndex.value = -1;
  recipientFocused.value = false;
  console.log('Selected recipient:', suggestion.accountHolderName, 'IBAN:', suggestion.iban);
};

const moveSuggestion = (direction) => {
  if (!recipientSuggestions.value.length) return;
  let idx = activeSuggestionIndex.value + direction;
  if (idx < 0) idx = recipientSuggestions.value.length - 1;
  if (idx >= recipientSuggestions.value.length) idx = 0;
  activeSuggestionIndex.value = idx;
};

const selectActiveSuggestion = () => {
  if (activeSuggestionIndex.value >= 0 && activeSuggestionIndex.value < recipientSuggestions.value.length) {
    selectRecipient(recipientSuggestions.value[activeSuggestionIndex.value]);
  }
};

const handleBlur = () => {
  setTimeout(() => {
    recipientFocused.value = false;
  }, 200);
};

const handleTransfer = async () => {
  console.log('=== Transfer Attempt ===');
  console.log('transferType:', transferType.value);
  console.log('fromIban:', fromIban.value);
  console.log('toIban:', toIban.value);
  console.log('recipientQuery:', recipientQuery.value);
  console.log('amount:', amount.value);
  console.log('transferLoading:', transferLoading.value);
  
  // Prevent multiple simultaneous transfers
  if (transferLoading.value) {
    console.log('Transfer already in progress, ignoring...');
    return;
  }
  
  error.value = '';
  successMessage.value = '';
  
  let fromAccount = ownAccounts.value.find(acc => acc.iban === fromIban.value);
  if (!fromAccount) {
    error.value = 'Invalid source account.';
    return;
  }
  
  if (!amount.value || amount.value <= 0) {
    error.value = 'Amount must be positive.';
    return;
  }
  
  // Handle different transfer types
  if (transferType.value === 'own') {
    if (!toIban.value) {
      error.value = 'Please select a savings account.';
      return;
    }
    if (toIban.value === fromIban.value) {
      error.value = 'Cannot transfer to the same account.';
      return;
    }
  } else {
    // For other transfers, be more flexible with IBAN validation
    let finalToIban = toIban.value;
    
    // If no toIban is set, check if recipientQuery looks like an IBAN
    if (!finalToIban && recipientQuery.value.trim()) {
      const ibanRegex = /^NL\d{2}[A-Z]{4}\d{10}$/i;
      if (ibanRegex.test(recipientQuery.value.trim())) {
        finalToIban = recipientQuery.value.trim().toUpperCase();
        console.log('Using IBAN from recipientQuery:', finalToIban);
      }
    }
    
    // Final validation
    if (!finalToIban) {
      if (recipientQuery.value.trim()) {
        error.value = 'No recipients found. Please:\n• Select a recipient from search results\n• Enter a complete IBAN (NL##BANK##########)\n• Try searching with a different name';
      } else {
        error.value = 'Please enter a recipient IBAN or search for a recipient by name.';
      }
      return;
    }
    
    // Validate IBAN format
    const ibanRegex = /^NL\d{2}[A-Z]{4}\d{10}$/i;
    if (!ibanRegex.test(finalToIban)) {
      error.value = 'Please enter a valid Dutch IBAN (format: NL##BANK##########).';
      return;
    }
    
    // Set the final IBAN
    toIban.value = finalToIban;
    console.log('Final toIban:', toIban.value);
  }
  
  transferLoading.value = true;
  
  try {
    console.log('Making transfer request...');
    const transferData = { 
      fromIban: fromIban.value, 
      toIban: toIban.value, 
      amount: amount.value 
    };
    console.log('Transfer data:', transferData);
    
    await customerTransfer(transferData);
    console.log('Transfer successful!');
    
    await fetchOwnAccounts(); // Refresh balances
    successMessage.value = 'Transfer successful!';
    
    // Reset form
    amount.value = null;
    toIban.value = '';
    fromIban.value = '';
    recipientQuery.value = '';
    recipientSuggestions.value = [];
    activeSuggestionIndex.value = -1;
    
  } catch (err) {
    console.error('Transfer failed:', err);
    if (err.response?.status === 403) {
      error.value = err.response.data || 'Transfer not allowed: limit exceeded or insufficient funds.';
    } else if (err.response?.status === 400) {
      error.value = err.response.data || 'Invalid transfer request.';
    } else if (err.response?.data) {
      if (typeof err.response.data === 'string') {
        error.value = err.response.data;
      } else if (err.response.data.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Transfer failed.';
      }
    } else {
      error.value = err.message || 'Transfer failed.';
    }
  } finally {
    transferLoading.value = false;
  }
};



onMounted(async () => {
  await fetchOwnAccounts();
});
</script>

<style scoped>
.transfer-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f5f5 100%);
  padding: 0 0 40px 0;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
}
.transfer-card {
  max-width: 440px;
  margin: 48px auto 0 auto;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(25, 118, 210, 0.13);
  padding: 36px 32px 32px 32px;
  position: relative;
  border: 1.5px solid #e3f2fd;
}
h2 {
  text-align: center;
  color: #1976d2;
  margin-bottom: 28px;
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: 1px;
}
.icon {
  font-size: 1.5rem;
  margin-right: 8px;
}
.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
label {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  letter-spacing: 0.2px;
}
.tab-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.tab-row button {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 8px 8px 0 0;
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-size: 1rem;
}
.tab-row button.active {
  background: #1976d2;
  color: #fff;
  box-shadow: 0 2px 8px #1976d220;
}
select, input[type="number"], input[type="text"] {
  padding: 14px;
  border: 1.5px solid #bdbdbd;
  border-radius: 8px;
  font-size: 1rem;
  background: #fafbfc;
  transition: border 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px #1976d210;
}
select:focus, input:focus {
  border: 1.5px solid #1976d2;
  outline: none;
  box-shadow: 0 2px 8px #1976d220;
}
.input-icon {
  display: flex;
  align-items: center;
  position: relative;
}
.input-icon .euro {
  position: absolute;
  left: 14px;
  color: #1976d2;
  font-weight: 700;
  font-size: 1.1rem;
}
.input-icon input[type="number"] {
  padding-left: 32px;
}
.input-icon .search-icon {
  position: absolute;
  right: 14px;
  color: #bdbdbd;
  font-size: 1.1rem;
  pointer-events: none;
}
.input-icon.recipient-autocomplete {
  position: relative;
  margin-top: 18px;
}
.input-icon.recipient-autocomplete input.modern-input {
  padding: 20px 40px 8px 16px;
  border-radius: 12px;
  border: 1.5px solid #bdbdbd;
  font-size: 1.1rem;
  background: #fafbfc;
  transition: border 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px #1976d210;
}
.input-icon.recipient-autocomplete input.modern-input:focus {
  border: 1.5px solid #1976d2;
  box-shadow: 0 2px 12px #1976d220;
}
/* When suggestions are visible, adjust input border radius */
.recipient-form-group.has-suggestions .input-icon.recipient-autocomplete input.modern-input {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1.5px solid #1976d2;
  border-top: none; /* Connect seamlessly with input */
  border-radius: 0 0 12px 12px;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
  animation: fadeIn 0.2s;
}
.suggestions-list li {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 1rem;
  border-bottom: 1px solid #f0f0f0;
}
.suggestions-list li:last-child {
  border-bottom: none;
}
.suggestions-list li.active, 
.suggestions-list li:hover {
  background: #e3f2fd;
  color: #1976d2;
}
.suggestion-name {
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}
.suggestion-iban {
  font-size: 0.9rem;
  color: #666;
  font-family: monospace;
}
button[type="submit"] {
  margin-top: 10px;
  padding: 16px 0;
  background: linear-gradient(90deg, #1976d2 60%, #42a5f5 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px #1976d220;
}
button[type="submit"]:hover:not(:disabled) {
  background: linear-gradient(90deg, #1565c0 60%, #1976d2 100%);
}
button[type="submit"]:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}
.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
  font-weight: 500;
  margin-top: 18px;
}
.spinner {
  width: 22px;
  height: 22px;
  border: 3px solid #90caf9;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  margin-right: 10px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px);}
  to { opacity: 1; transform: translateY(0);}
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 14px;
  border-radius: 8px;
  margin-top: 18px;
  text-align: center;
  font-weight: 500;
  font-size: 1rem;
}
.success-message {
  background: #e8f5e9;
  color: #388e3c;
  padding: 14px;
  border-radius: 8px;
  margin-top: 18px;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1rem;
}
.checkmark {
  font-size: 1.3rem;
}
@media (max-width: 600px) {
  .transfer-card {
    padding: 18px 6px 18px 6px;
    margin: 24px 4px 0 4px;
  }
  h2 {
    font-size: 1.2rem;
  }
}
.floating-label {
  position: absolute;
  left: 18px;
  top: 18px;
  color: #888;
  font-size: 1rem;
  pointer-events: none;
  transition: 0.2s;
  background: #fff;
  padding: 0 4px;
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 60px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.input-icon.recipient-autocomplete {
  position: relative;
  margin-top: 18px;
}
.input-icon.recipient-autocomplete input.modern-input {
  padding: 20px 40px 8px 16px;
  border-radius: 12px;
  border: 1.5px solid #bdbdbd;
  font-size: 1.1rem;
  background: #fafbfc;
  transition: border 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px #1976d210;
}
.input-icon.recipient-autocomplete input.modern-input:focus {
  border: 1.5px solid #1976d2;
  box-shadow: 0 2px 12px #1976d220;
}
.floating-label.focused,
.input-icon.recipient-autocomplete input.modern-input:focus + .floating-label,
.input-icon.recipient-autocomplete input.modern-input:not(:placeholder-shown) + .floating-label {
  top: -10px;
  left: 12px;
  font-size: 0.85rem;
  color: #1976d2;
  background: #fff;
  padding: 0 6px;
  max-width: calc(100% - 24px);
  overflow: visible;
  text-overflow: initial;
}
.suggestions-list.modern-dropdown {
  border-radius: 12px;
  box-shadow: 0 8px 32px #1976d220;
  border: 1.5px solid #1976d2;
  margin-top: 4px;
  padding: 0;
  background: #fff;
  z-index: 10;
}
.suggestions-list.modern-dropdown li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 18px;
  cursor: pointer;
  font-size: 1.08rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s, font-weight 0.15s;
}
.suggestions-list.modern-dropdown li:last-child {
  border-bottom: none;
}
.suggestions-list.modern-dropdown li.active,
.suggestions-list.modern-dropdown li:hover {
  background: #e3f2fd;
  font-weight: 700;
  color: #1976d2;
}
.suggestion-name {
  font-weight: 600;
  font-size: 1.08rem;
}
.suggestion-iban {
  font-size: 0.97rem;
  color: #888;
  margin-top: 2px;
}
@media (max-width: 600px) {
  .suggestions-list.modern-dropdown li {
    padding: 12px 10px;
    font-size: 1rem;
  }
}
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #90caf9;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  animation: spin 1s linear infinite;
}
.loading-suggestion, .no-results, .hint-message {
  padding: 13px 16px;
  font-size: 1rem;
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;
}
.no-results {
  color: #888;
}
.no-results.non-clickable {
  cursor: default;
  pointer-events: none;
}
.no-results.non-clickable:hover {
  background: transparent;
  font-weight: normal;
  color: #888;
}
.hint-message {
  color: #1976d2;
  font-style: normal;
}
.hint-message.non-clickable {
  cursor: default;
  pointer-events: none;
}
.hint-message.non-clickable:hover {
  background: transparent;
  font-weight: normal;
  color: #1976d2;
}
.recipient-form-group.has-suggestions {
  margin-bottom: 80px; /* Extra space when dropdown is visible */
}
</style>