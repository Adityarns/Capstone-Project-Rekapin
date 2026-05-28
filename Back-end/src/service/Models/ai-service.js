import FormData from "form-data";
import fetch from "node-fetch";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

// ============================================================
//  1. SCAN RECEIPT
//     Kirim gambar struk ke Python API
//     Return: data hasil ekstraksi dari struk
// ============================================================
export const scanReceiptWithAI = async ({ base64Image, mediaType }) => {
  // Convert base64 kembali ke buffer untuk dikirim sebagai file
  const imageBuffer = Buffer.from(base64Image, "base64");
  const extension = mediaType.split("/")[1]; // "image/jpeg" → "jpeg"

  const formData = new FormData();
  formData.append("image", imageBuffer, {
    filename: `receipt.${extension}`,
    contentType: mediaType,
  });

  const response = await fetch(`${ML_API_URL}/ml/receipt`, {
    method: "POST",
    body: formData,
    headers: formData.getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Receipt model error: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    title: result.transaction?.title ?? null,
    amount: result.predicted_total ?? null,
    transaction_date: result.transaction?.date ?? null,
    category_suggestion: result.transaction?.category ?? null,
    transaction_type: result.transaction?.type ?? null,
    description: result.transaction?.description ?? null,
  };
};

// ============================================================
//  2. CARBON CALCULATION
//     Kirim deskripsi transaksi + quantity ke Python API
//     Return: hasil klasifikasi BBM + total emisi karbon
// ============================================================
export const calculateCarbonWithAI = async ({ description, quantity }) => {
  const response = await fetch(`${ML_API_URL}/ml/carbon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: description,
      volume_liter: quantity,
    }),
  });

  if (!response.ok) {
    throw new Error(`Carbon model error: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
};

// ============================================================
//  3. EXPENSE FORECAST
//     Kirim array total harian ke Python API
//     Return: prediksi pengeluaran ke depan
// ============================================================
export const forecastExpenseWithAI = async ({ dailyTotals }) => {
  const response = await fetch(`${ML_API_URL}/ml/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      daily_totals: dailyTotals,
    }),
  });

  if (!response.ok) {
    throw new Error(`Forecast model error: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
};
