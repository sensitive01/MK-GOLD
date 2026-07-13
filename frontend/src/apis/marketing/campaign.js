import apiClient from '../http';

export const getCampaigns = async () => {
  try {
    const response = await apiClient().get(`/api/v1.0/campaign`);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const getCampaignById = async (id) => {
  try {
    const response = await apiClient().get(`/api/v1.0/campaign/${id}`);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const createCampaign = async (data) => {
  try {
    const response = await apiClient().post(`/api/v1.0/campaign`, data);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const updateCampaign = async (id, data) => {
  try {
    const response = await apiClient().put(`/api/v1.0/campaign/${id}`, data);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const addDailyStatus = async (id, data) => {
  try {
    const response = await apiClient().post(`/api/v1.0/campaign/${id}/daily-status`, data);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const addLoadAmount = async (id, data) => {
  try {
    const response = await apiClient().post(`/api/v1.0/campaign/${id}/load-amount`, data);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const deleteCampaign = async (id) => {
  try {
    const response = await apiClient().delete(`/api/v1.0/campaign/${id}`);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const updateLoadAmountStatus = async (campaignId, loadAmountId, status) => {
  try {
    const response = await apiClient().put(`/api/v1.0/campaign/${campaignId}/load-amount/${loadAmountId}`, { status });
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

export const getAllLoadAmounts = async () => {
  try {
    const response = await apiClient().get(`/api/v1.0/campaign/load-amounts/all`);
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};
