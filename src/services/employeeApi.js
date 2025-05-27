import axiosInstance from '../config/axios';

const API_URL = '/employee';

export const getUnapprovedCustomers = () => {
  return axiosInstance.get(`${API_URL}/customers/unapproved`);
};

export const approveCustomer = (customerId) => {
  const requestBody = {
    checkingAccount: {
      accountType: 'CHECKING',
      absoluteLimit: 1000.00,
      dailyLimit: 500.00,
      dailyTransferLimit: 1000.00  // Align with absolute limit
    },
    savingsAccount: {
      accountType: 'SAVINGS',
      absoluteLimit: 0.00,
      dailyLimit: 0.00,
      dailyTransferLimit: 0.00  // Align with absolute limit
    }
  };
  return axiosInstance.post(`${API_URL}/customers/${customerId}/approve`, requestBody);
};

export const getAllCustomers = () => {
  return axiosInstance.get(`${API_URL}/customers`);
};

export const getCustomerAccounts = (customerId) => {
  return axiosInstance.get(`${API_URL}/accounts/customer/${customerId}`);
};

export const getAccountTransactionsForEmployee = (iban) => {
  return axiosInstance.get(`${API_URL}/transactions/account/${iban}`);
};

export const getAllTransactionsForEmployee = () => {
  return axiosInstance.get(`${API_URL}/transactions`);
};

export const createEmployeeTransfer = (transferRequest) => {
  return axiosInstance.post(`${API_URL}/transfer`, transferRequest);
};

export const updateAccountLimits = (iban, limitUpdateRequest) => {
  return axiosInstance.put(`${API_URL}/accounts/${iban}/limits`, limitUpdateRequest);
};

export const closeAccountByEmployee = (iban) => {
  return axiosInstance.delete(`${API_URL}/accounts/${iban}`);
};

export const reopenAccountByEmployee = (iban) => {
  return axiosInstance.put(`${API_URL}/accounts/${iban}/reopen`);
};

export const searchCustomersByName = (firstName, lastName) => {
    return axiosInstance.get(`${API_URL}/customers/search`, {
        params: { firstName, lastName }
    });
};


export default {
  getUnapprovedCustomers,
  approveCustomer,
  getAllCustomers,
  getCustomerAccounts,
  getAccountTransactionsForEmployee,
  getAllTransactionsForEmployee,
  createEmployeeTransfer,
  updateAccountLimits,
  closeAccountByEmployee,
  reopenAccountByEmployee,
  searchCustomersByName
}; 