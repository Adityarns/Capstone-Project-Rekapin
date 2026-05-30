import { api } from "./api";

export async function getTeamMembers(businessId) {
  const response = await api.get(
    `/businesses/${businessId}/members`
  );

  console.log("TEAM RESPONSE:", response.data);

  return response.data.teamMembers;
}

export async function removeTeamMember(businessId, userId) {
  const response = await api.delete(
    `/businesses/${businessId}/members/${userId}`
  );

  return response.data;
}