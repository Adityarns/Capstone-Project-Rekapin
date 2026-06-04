import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    realtime: {
      transport: WebSocket,
    },
  },
);

const PROFILE_BUCKET = "profile-img";
// const TRANSACTION_BUCKET = "transaction-img";

export const uploadAvatar = async ({ userId, fileBuffer, mimeType }) => {
  // Format nama file: profile-img/userId.jpg agar otomatis overwrite foto lama
  const extension = mimeType.split("/")[1]; // "image/jpeg" → "jpeg"
  const filePath = `${userId}.${extension}`;

  const { error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true, // overwrite jika file sudah ada
    });

  if (error) throw new Error(`Gagal upload avatar: ${error.message}`);

  // Ambil public URL setelah upload berhasil
  const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
};

export const deleteAvatar = async (avatarUrl) => {
  // Ekstrak nama file dari URL
  // contoh URL: https://xxx.supabase.co/storage/v1/object/public/profile-img/userId.jpg
  const filePath = avatarUrl.split(`/${PROFILE_BUCKET}/`)[1];
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .remove([filePath]);
  if (error) throw new Error(`Gagal hapus avatar lama: ${error.message}`);
};

// export const uploadTransactionImage = async ({ fileBuffer, mimeType }) => {
//   // Format nama file: profile-img/userId.jpg agar otomatis overwrite foto lama
//   const extension = mimeType.split("/")[1]; // "image/jpeg" → "jpeg"
//   const filePath = `transaction-images/${Date.now()}.${extension}`;

//   const { error } = await supabase.storage
//     .from(TRANSACTION_BUCKET)
//     .upload(filePath, fileBuffer, {
//       contentType: mimeType,
//       upsert: true, // overwrite jika file sudah ada
//     });

//   if (error) throw new Error(`Gagal upload gambar: ${error.message}`);

//   // Ambil public URL setelah upload berhasil
//   const { data } = supabase.storage
//     .from(TRANSACTION_BUCKET)
//     .getPublicUrl(filePath);

//   return data.publicUrl;
// };
