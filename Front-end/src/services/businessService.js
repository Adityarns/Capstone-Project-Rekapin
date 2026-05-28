import { api } from "./api";

export async function updateBusiness(businessId, payload) {
  const response = await api.put(
    `/businesses/${businessId}`,
    {
      business_name: payload.name,
      industry: payload.industry,
      phone_number: payload.phone,
      address: payload.address,
    }
  );

  return response.data.data;
}