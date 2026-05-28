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
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return response(
        res,
        400,
        "Business ID wajib disertakan dalam URL parameter",
        null,
      );
    }

    // 1. Tarik riwayat pengeluaran agregat harian selama 30 hari ke belakang dari database PostgreSQL
    const rawHistory =
      await FinancialReportRepositories.getDailyExpensesLast30Days(businessId);

    // 2. Ekstrak data hasil kueri menjadi array beralas angka float murni sesuai destrukturisasi { dailyTotals }
    let dailyTotals = rawHistory.map((row) => parseFloat(row.total_amount));

    // Fallback otomatis jika bisnis baru mendaftar dan belum memiliki riwayat transaksi sama sekali
    if (dailyTotals.length === 0) {
      dailyTotals = [0.0];
    }

    // 3. Panggil fungsi dari ai-service.js milik Anda menggunakan pencocokan properti objek: { dailyTotals }
    const aiResult = await forecastExpenseWithAI({ dailyTotals });

    // 4. Susun struktur data respons balik yang rapi dan informatif untuk di-render di UI Frontend Rekapin
    const formattedData = {
      businessId,
      historicalDaysAnalyzed: rawHistory.length,
      forecast: {
        predictedSpendNextHorizon: aiResult.predicted_spend_next_horizon, // Total pengeluaran 30 hari ke depan (Rupiah)
        predictedDailyAvg: aiResult.predicted_daily_avg, // Rata-rata pengeluaran harian (Rupiah)
        horizonDays: aiResult.horizon_days, // 30
        windowDays: aiResult.window_days, // 30
        confidenceNote: aiResult.confidence_note, // Catatan akurasi
      },
    };

    return response(
      res,
      200,
      "AI Expense Forecast berhasil dihitung menggunakan model Bidirectional LSTM",
      formattedData,
    );
  } catch (error) {
    // Penanganan taktis jika peladen Python FastAPI belum diaktifkan
    if (
      error.message.includes("fetch") ||
      error.message.includes("ECONNREFUSED")
    ) {
      return response(
        res,
        502,
        "AI Engine server sedang offline, pastikan backend Python Anda sudah berjalan di port 5000",
        null,
      );
    }
    next(error);
  }
};
