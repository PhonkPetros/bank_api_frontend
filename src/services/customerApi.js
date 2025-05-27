import axiosInstance from '@/config/axios';

const API_URL = '/customer';

export const getCustomerAccounts = async () => {
  try {
    console.log('Fetching customer accounts...');
    const response = await axiosInstance.get(`${API_URL}/accounts`);
    console.log('Raw API Response:', response);
    if (response && response.data) {
      // Map the response data to match the expected format
      const mappedData = response.data.map(account => {
        console.log('Original account data:', account);
        // Keep the original accountType if it exists, otherwise try to map from account_type
        const mapped = {
          ...account,
          accountType: account.accountType || account.account_type,
          absoluteLimit: account.absoluteLimit || account.absolute_limit,
          dailyLimit: account.dailyLimit || account.daily_limit,
          active: account.active === true
        };
        console.log('Mapped account data:', mapped);
        return mapped;
      });
      console.log('Final mapped data:', mappedData);
      return { data: mappedData };
    }
    return response;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers
    });
    throw error;
  }
};

export const atmDeposit = async (iban, amount) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/transactions/atm/deposit`, { iban, amount });
    return response;
  } catch (error) {
    console.error('Error during ATM deposit:', error);
    throw error;
  }
};

export const atmWithdraw = async (iban, amount) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/transactions/atm/withdraw`, { iban, amount });
    return response;
  } catch (error) {
    console.error('Error during ATM withdrawal:', error);
    throw error;
  }
};

export const customerTransfer = async (transferData) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/transactions/transfer`, transferData);
    return response;
  } catch (error) {
    console.error('Error during transfer:', error);
    throw error;
  }
};

export const searchCustomerIbans = async (firstName, lastName) => {
  try {
    console.log('customerApi.searchCustomerIbans called with:', { firstName, lastName });
    console.log('Making POST request to:', `${API_URL}/accounts/search-iban`);
    
    const requestData = { firstName, lastName };
    console.log('Request data:', requestData);
    
    const response = await axiosInstance.post(`${API_URL}/accounts/search-iban`, requestData);
    console.log('searchCustomerIbans response:', response);
    console.log('searchCustomerIbans response.data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error in searchCustomerIbans:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers,
      config: error.config
    });
    throw error;
  }
};

export default {
  getCustomerAccounts,
  atmDeposit,
  atmWithdraw,
  customerTransfer,
  searchCustomerIbans
}; 