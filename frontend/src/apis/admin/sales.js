import apiClient from '../http';

async function getSales(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/sales/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function consolidatedSaleReport(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/report/get-consolidated-sale-report', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function findSales(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/sales/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getSalesById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/sales/get/${id}`);
    if (response.data && response.data.status === false && (response.data.message === 'Unauthorized' || response.data.message === 'Unauthorized to view')) {
      const fallback = await apiClient().get(`/api/v1.0/branch/sales/get/${id}`);
      return fallback.data;
    }
    return response.data;
  } catch (err) {
    try {
      const fallback = await apiClient().get(`/api/v1.0/branch/sales/get/${id}`);
      return fallback.data;
    } catch (e) {
      return err;
    }
  }
}

async function updateSales(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/sales/update/${id}`, payload);
    if (response.data && response.data.status === false && (response.data.message === 'Unauthorized' || response.data.message === 'Unauthorized to update')) {
      const fallback = await apiClient().post(`/api/v1.0/branch/sales/update/${id}`, payload);
      return fallback.data;
    }
    return response.data;
  } catch (err) {
    try {
      const fallback = await apiClient().post(`/api/v1.0/branch/sales/update/${id}`, payload);
      return fallback.data;
    } catch (e) {
      return err;
    }
  }
}

async function deleteSalesById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/sales/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function verifyFinancePayment(id, paymentId, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/sales/verify-finance-payment/${id}/${paymentId}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getSales, consolidatedSaleReport, findSales, getSalesById, updateSales, deleteSalesById, verifyFinancePayment };
