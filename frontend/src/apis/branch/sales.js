import apiClient from '../http';

async function getSales(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/sales/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function consolidatedSaleReport(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/report/get-consolidated-sale-report', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function findSales(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/sales/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getSalesById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/sales/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createSales(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/sales/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateSales(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/sales/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteSalesById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/sales/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getSales, consolidatedSaleReport, findSales, getSalesById, createSales, updateSales, deleteSalesById };
