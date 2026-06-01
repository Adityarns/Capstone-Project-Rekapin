import { api } from "./api";

export async function updateBusiness(businessId, payload) {
  const response = await api.put(`/businesses/${businessId}`, {
    business_name: payload.name,
    industry: payload.industry,
    phone_number: payload.phone,
    address: payload.address,
  });

  return response.data.data;
}

export async function getBusinessById(businessId) {
  const response = await api.get(`/businesses/${businessId}`);

  console.log("FULL RESPONSE:", response.data);

  return response.data;
}

export async function getAccessibleBusinesses(userId) {
  const response = await api.get(`/businesses/access/${userId}`);
  return response.data;
}
