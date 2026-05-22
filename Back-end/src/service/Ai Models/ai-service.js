// ============================================================
//  AI Service — Receipt Scanner
//  Saat ini menggunakan mock data (menunggu model dari AI Engineer)
//  Nanti cukup ganti fungsi scanReceiptWithAI saja
//  tanpa perlu ubah controller
// ============================================================

export const scanReceiptWithAI = async ({ base64Image, mediaType }) => {
  // ======================================================
  //  TODO: Ganti bagian ini dengan model dari AI Engineer
  //  Contoh integrasi nanti:
  //
  //  const result = await AIEngineerModel.extract({
  //    image: base64Image,
  //    type: mediaType,
  //  });
  //  return result;
  // ======================================================

  // Mock response sementara — mengembalikan data kosong
  // agar frontend bisa mulai integrasi tanpa menunggu model
  return {
    title: null,
    amount: null,
    transaction_date: null,
    category_suggestion: null,
    transaction_type: null,
    description: null,
  };
};
