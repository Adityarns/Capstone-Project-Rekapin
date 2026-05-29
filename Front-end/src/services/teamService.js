import { api } from "./api";

export async function getTeamMembers(businessId) {
  const response = await api.get(
    `/businesses/${businessId}/members`
  );

  console.log("TEAM RESPONSE:", response.data);

  return response.data.teamMembers;
}