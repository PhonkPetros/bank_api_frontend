<template>
  <div class="all-transfers-page">
    <h2>All Transfers</h2>
    <div v-if="loading" class="loading-message">Loading transfers...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <table v-if="!loading && !error && transfers.length" class="transfers-table">
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
        <tr v-for="tx in transfers" :key="tx.id">
          <td>{{ formatDate(tx.timestamp) }}</td>
          <td>
            <span class="truncate clickable" :title="tx.fromIban" @click="showPopup(tx.fromIban, 'From IBAN')">{{ tx.fromIban || '-' }}</span>
          </td>
          <td>
            <span class="truncate clickable" :title="tx.toIban" @click="showPopup(tx.toIban, 'To IBAN')">{{ tx.toIban || '-' }}</span>
          </td>
          <td :class="amountClass(tx) + ' amount-cell'">
            <span v-if="amountSign(tx)">{{ amountSign(tx) }}</span>
            €{{ tx.amount.toFixed(2) }}
          </td>
          <td>{{ tx.transactionType }}</td>
          <td>
            <span class="truncate clickable" :title="tx.initiatedByFullName" @click="showPopup(tx.initiatedByFullName, 'Initiated By')">{{ tx.initiatedByFullName || '-' }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!loading && !error && !transfers.length" class="no-transfers-message">No transfers found.</div>

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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAllTransactionsForEmployee } from '@/services/employeeApi';

const loading = ref(true);
const error = ref('');
const transfers = ref([]);

const popup = ref({ visible: false, value: '', label: '' });

function showPopup(value, label) {
  if (!value) return;
  popup.value = { visible: true, value, label };
}
function closePopup() {
  popup.value = { visible: false, value: '', label: '' };
}

const fetchTransfers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getAllTransactionsForEmployee();
    // Sort transfers by timestamp in descending order (most recent first)
    transfers.value = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load transfers.';
  } finally {
    loading.value = false;
  }
};

function amountClass(tx) {
  if (tx.transactionType === 'DEPOSIT') return 'amount-positive';
  if (tx.transactionType === 'WITHDRAWAL') return 'amount-negative';
  if (tx.transactionType === 'TRANSFER') {
    if (tx.fromIban) return 'amount-negative';
    if (tx.toIban) return 'amount-positive';
  }
  return '';
}

function amountSign(tx) {
  if (tx.transactionType === 'DEPOSIT') return '+';
  if (tx.transactionType === 'WITHDRAWAL') return '-';
  if (tx.transactionType === 'TRANSFER') {
    if (tx.fromIban) return '-';
    if (tx.toIban) return '+';
  }
  return '';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

onMounted(() => {
  fetchTransfers();
});
</script>

<style scoped>
.all-transfers-page {
  max-width: 1100px;
  margin: 32px auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px #1976d220;
  overflow-x: auto;
}
h2 {
  color: #1976d2;
  margin-bottom: 24px;
  text-align: center;
}
.transfers-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  box-shadow: 0 1px 3px #1976d210;
}
.transfers-table th, .transfers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
}
.transfers-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #424242;
}
.amount-positive {
  color: #388e3c;
  font-weight: 600;
}
.amount-negative {
  color: #c62828;
  font-weight: 600;
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
.transfers-table tr:hover {
  background: #f0f7ff;
}
.loading-message, .error-message, .no-transfers-message {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}
.loading-message {
  background: #e3f2fd;
  color: #1976d2;
}
.error-message {
  background: #ffebee;
  color: #c62828;
}
.no-transfers-message {
  background: #f5f5f5;
  color: #616161;
}
@media (max-width: 900px) {
  .all-transfers-page {
    padding: 8px;
  }
  .transfers-table th, .transfers-table td {
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
</style> 