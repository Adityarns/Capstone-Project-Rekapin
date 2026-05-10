import UserRepositories from "../repositories/users-repositories.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";

export const CreateUser = async (req, res, next) => {
  const { name, email, password } = req.validated;
  const isEmailExist = await UserRepositories.verifyEmail(email);
  if (isEmailExist) {
    return next(
      new InvariantError("Gagal menambahkan akun, email sudah digunakan"),
    );
  }
  const user = await UserRepositories.CreateUser({
    name,
    email,
    password,
  });
  if (!user) {
    return next(new InvariantError("Akun gagal ditambahkan"));
  }
  return response(res, 201, "Akun berhasil ditambahkan", user);
};

export const getUserById = async (req, res, next) => {
  const { id } = req.params;
  const user = await UserRepositories.getUserById(id);
  if (!user) {
    return next(new NotFoundError("Akun tidak ditemukan"));
  }
  return response(res, 200, "Akun ditemukan", user);
};
