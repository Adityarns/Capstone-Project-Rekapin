import { api } from "./api";

export async function changePassword(
  userId,
  currentPassword,
  newPassword
) {
  const response = await api.patch(
    `/users/${userId}/password`,
    {
      currentPassword,
      newPassword,
    }
  );

  return response.data;
}