import apiClient from '../http';

async function importLeads(data) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/imported-lead/import', data);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getImportedLeads() {
  try {
    const response = await apiClient().get('/api/v1.0/branch/imported-lead/get');
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteImportedLead(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/imported-lead/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { importLeads, getImportedLeads, deleteImportedLead };
