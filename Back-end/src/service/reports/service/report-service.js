import FinancialReportRepositories from "../repositories/report-repositories.js";
import excelJS from "exceljs";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";

const calculateVariance = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return parseFloat(
    (((current - previous) / Math.abs(previous)) * 100).toFixed(1),
  );
};

const getQuarterDateRange = (quarter, year) => {
  const qRange = {
    Q1: { start: "-01-01T00:00:00.000Z", end: "-03-31T23:59:59.999Z" },
    Q2: { start: "-04-01T00:00:00.000Z", end: "-06-30T23:59:59.999Z" },
    Q3: { start: "-07-01T00:00:00.000Z", end: "-09-30T23:59:59.999Z" },
    Q4: { start: "-10-01T00:00:00.000Z", end: "-12-31T23:59:59.999Z" },
  };
  const selected = qRange[quarter] || qRange["Q3"];
  return { start: `${year}${selected.start}`, end: `${year}${selected.end}` };
};

const getPreviousQuarter = (quarter, year) => {
  if (quarter === "Q1") return { quarter: "Q4", year: year - 1 };
  return { quarter: `Q${parseInt(quarter.substring(1)) - 1}`, year };
};

class FinancialReportService {
  async calculateSummary({ businessId, quarter, year }) {
    const currentPeriod = getQuarterDateRange(quarter, year);
    const prevQ = getPreviousQuarter(quarter, year);
    const prevPeriod = getQuarterDateRange(prevQ.quarter, prevQ.year);

    const [currentData, prevData, currentCarbon, prevCarbon, cashFlow] =
      await Promise.all([
        FinancialReportRepositories.getFinancialDataByPeriod(
          businessId,
          currentPeriod.start,
          currentPeriod.end,
        ),
        FinancialReportRepositories.getFinancialDataByPeriod(
          businessId,
          prevPeriod.start,
          prevPeriod.end,
        ),
        FinancialReportRepositories.getCarbonTotalByPeriod(
          businessId,
          currentPeriod.start,
          currentPeriod.end,
        ),
        FinancialReportRepositories.getCarbonTotalByPeriod(
          businessId,
          prevPeriod.start,
          prevPeriod.end,
        ),
        FinancialReportRepositories.getMonthlyCashFlow(
          businessId,
          currentPeriod.start,
          currentPeriod.end,
        ),
      ]);

    // Memastikan pemetaan properti d.type berjalan mulus dari database
    const currentRevenue = currentData
      .filter((d) => d.type === "income")
      .reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);

    const currentExpense = currentData
      .filter((d) => d.type === "expense")
      .reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);

    const prevRevenue = prevData
      .filter((d) => d.type === "income")
      .reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);

    const prevExpense = prevData
      .filter((d) => d.type === "expense")
      .reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);

    // Hitung Net Income secara presisi
    const currentNetIncome = currentRevenue - currentExpense;
    const prevNetIncome = prevRevenue - prevExpense;

    return {
      summary: {
        total_revenue: currentRevenue,
        revenue_variance_percent: calculateVariance(
          currentRevenue,
          prevRevenue,
        ),
        net_income: currentNetIncome,
        net_income_variance_percent: calculateVariance(
          currentNetIncome,
          prevNetIncome,
        ),
        carbon_footprint_tons: parseFloat(
          (parseFloat(currentCarbon?.total_carbon || 0) / 1000).toFixed(6),
        ),
        carbon_variance_percent: calculateVariance(
          parseFloat(currentCarbon?.total_carbon || 0),
          parseFloat(prevCarbon?.total_carbon || 0),
        ),
        is_carbon_on_track:
          parseFloat(currentCarbon?.total_carbon || 0) <=
          parseFloat(prevCarbon?.total_carbon || 0),
      },
      cash_flow: cashFlow.map((cf) => ({
        month: cf.month_name,
        inflow: parseFloat(cf.inflow),
        outflow: parseFloat(cf.outflow),
      })),
    };
  }

  async generateStatement({ businessId, quarter, year }) {
    const currentPeriod = getQuarterDateRange(quarter, year);
    const prevQ = getPreviousQuarter(quarter, year);
    const prevPeriod = getQuarterDateRange(prevQ.quarter, prevQ.year);

    const [currentData, prevData] = await Promise.all([
      FinancialReportRepositories.getFinancialDataByPeriod(
        businessId,
        currentPeriod.start,
        currentPeriod.end,
      ),
      FinancialReportRepositories.getFinancialDataByPeriod(
        businessId,
        prevPeriod.start,
        prevPeriod.end,
      ),
    ]);

    const getAmount = (data, cat) =>
      parseFloat(
        data.find((d) => d.category_name.toLowerCase() === cat.toLowerCase())
          ?.total_amount || 0,
      );

    const extractMetrics = (data) => {
      const rev = data
        .filter((d) => d.type === "income")
        .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
      const cogs = getAmount(data, "HPP") || getAmount(data, "COGS");
      const sal = getAmount(data, "Salaries") || getAmount(data, "Beban Gaji");
      const rent = getAmount(data, "Rent") || getAmount(data, "Beban Sewa");
      const util =
        getAmount(data, "Utilities") || getAmount(data, "Beban Utilitas");

      // Ekstraksi nilai untuk kategori baru: Transportation
      const trans =
        getAmount(data, "Transportation") ||
        getAmount(data, "Beban Transportasi");

      const totalExp = data
        .filter((d) => d.type === "expense")
        .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

      // Mengurangi total pengeluaran dengan beban transportasi agar data other_expenses tidak dobel
      const other = totalExp - (cogs + sal + rent + util + trans);

      return {
        rev,
        cogs,
        gross: rev - cogs,
        sal,
        rent,
        util,
        trans,
        other,
        totalOp: sal + rent + util + trans + other,
        net: rev - cogs - (sal + rent + util + trans + other),
      };
    };

    const c = extractMetrics(currentData);
    const p = extractMetrics(prevData);

    return {
      metadata: {
        current_quarter: `${quarter} ${year}`,
        previous_quarter: `${prevQ.quarter} ${prevQ.year}`,
      },
      statement: {
        revenues: {
          current: c.rev,
          previous: p.rev,
          variance: calculateVariance(c.rev, p.rev),
        },
        cogs: {
          current: c.cogs,
          previous: p.cogs,
          variance: calculateVariance(c.cogs, p.cogs),
        },
        gross_profit: {
          current: c.gross,
          previous: p.gross,
          variance: calculateVariance(c.gross, p.gross),
        },
        operating_expenses: {
          salaries_and_wages: {
            current: c.sal,
            previous: p.sal,
            variance: calculateVariance(c.sal, p.sal),
          },
          rent_expense: {
            current: c.rent,
            previous: p.rent,
            variance: calculateVariance(c.rent, p.rent),
          },
          utilities: {
            current: c.util,
            previous: p.util,
            variance: calculateVariance(c.util, p.util),
          },
          // Memasukkan metrik transportasi baru ke dalam skema respons objek laba rugi
          transportation: {
            current: c.trans,
            previous: p.trans,
            variance: calculateVariance(c.trans, p.trans),
          },
          other_expenses: {
            current: c.other,
            previous: p.other,
            variance: calculateVariance(c.other, p.other),
          },
        },
        total_operating_expenses: {
          current: c.totalOp,
          previous: p.totalOp,
          variance: calculateVariance(c.totalOp, p.totalOp),
        },
        net_income: {
          current: c.net,
          previous: p.net,
          variance: calculateVariance(c.net, p.net),
        },
      },
    };
  }

  async generateExcelReport({ businessId, quarter, year }) {
    const { start, end } = getQuarterDateRange(quarter, year);

    // 1. Tarik Data CUKUP 2 SAJA (Profil dan Detail Transaksi) agar lebih aman
    const [profile, detailedTransactions] = await Promise.all([
      FinancialReportRepositories.getBusinessProfileForReport(businessId),
      FinancialReportRepositories.getDetailedTransactionsByPeriod(
        businessId,
        start,
        end,
      ),
    ]);

    console.log("\n=== RADAR JARVIS ===");
    console.log("1. Business ID dari Postman :", businessId);
    console.log("2. Waktu Start Pencarian    :", start);
    console.log("3. Waktu End Pencarian      :", end);
    console.log("4. Total Transaksi Ketemu   :", detailedTransactions.length);
    if (detailedTransactions.length > 0) {
      console.log("5. Contoh Data Pertama      :", detailedTransactions[0]);
    }
    console.log("====================\n");
    // ──────────────────────────────────────────────────────────────

    if (!profile) {
      throw new Error("Data profil bisnis tidak ditemukan di database.");
    }
    if (!profile) {
      throw new Error("Data profil bisnis tidak ditemukan di database.");
    }

    // 2. Kalkulasi Laba Rugi LANGSUNG dari detailedTransactions (Anti-Zonk)
    let totalIncome = 0;
    let totalExpense = 0;
    detailedTransactions.forEach((trx) => {
      // Pastikan membaca dari trx.type dan trx.amount
      if (trx.type === "income") totalIncome += parseFloat(trx.amount || 0);
      if (trx.type === "expense") totalExpense += parseFloat(trx.amount || 0);
    });
    const netIncome = totalIncome - totalExpense;

    // 3. Inisialisasi Buku Kerja
    const workbook = new excelJS.Workbook();
    workbook.creator = "Rekapin System";

    // ─── LEMBAR 1: LAPORAN LABA RUGI ─────────────
    const sheet1 = workbook.addWorksheet("Laba Rugi");

    // ATUR LEBAR KOLOM DULU (Tanpa mendefinisikan header agar Baris 1 tidak tertimpa)
    sheet1.getColumn(1).width = 40;
    sheet1.getColumn(2).width = 25;

    // Header Surat
    sheet1.mergeCells("A1:B1");
    sheet1.getCell("A1").value = profile.business_name.toUpperCase();
    sheet1.getCell("A1").font = { size: 14, bold: true };

    sheet1.mergeCells("A2:B2");
    sheet1.getCell("A2").value =
      `Laporan Laba Rugi - Periode ${quarter} ${year}`;

    sheet1.mergeCells("A3:B3");
    sheet1.getCell("A3").value = profile.address || "Alamat tidak tersedia";

    sheet1.addRow([]); // Baris 4 kosong sebagai jarak

    // Baris 5: Header Tabel Manual
    sheet1.getCell("A5").value = "Keterangan Akun";
    sheet1.getCell("B5").value = "Nominal (Rp)";
    sheet1.getRow(5).font = { bold: true };
    sheet1.getRow(5).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Baris 6, 7, 8: Data
    sheet1.addRow(["Total Pendapatan (Revenue)", totalIncome]);
    sheet1.addRow(["Total Beban (Expense)", totalExpense]);

    const netRow = sheet1.addRow(["LABA BERSIH (NET INCOME)", netIncome]);
    netRow.font = { bold: true };

    // Format Rupiah
    sheet1.getColumn(2).numFmt = '"Rp"#,##0.00;[Red]\-"Rp"#,##0.00';

    // ─── LEMBAR 2: RINCIAN TRANSAKSI ───────────
    const sheet2 = workbook.addWorksheet("Rincian Transaksi");

    // Untuk sheet 2 aman menggunakan columns karena memang tabel dari baris 1
    sheet2.columns = [
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Tipe", key: "type", width: 15 },
      { header: "Kategori", key: "category", width: 25 },
      { header: "Deskripsi", key: "description", width: 40 },
      { header: "Nominal (Rp)", key: "amount", width: 20 },
    ];

    sheet2.getRow(1).font = { bold: true };
    sheet2.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4CAF50" },
    };
    sheet2.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    detailedTransactions.forEach((trx) => {
      sheet2.addRow({
        date: trx.date,
        type: trx.type.toUpperCase(),
        category: trx.category || "Uncategorized",
        description: trx.description || "-",
        amount: parseFloat(trx.amount || 0),
      });
    });

    sheet2.getColumn(5).numFmt = '"Rp"#,##0.00;[Red]\-"Rp"#,##0.00';

    // 4. Return Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Rekapin_${profile.business_name.replace(/\s+/g, "_")}_${quarter}_${year}.xlsx`;

    return { buffer, fileName };
  }

  async generatePDFReport({ businessId, quarter, year }) {
    const { start, end } = getQuarterDateRange(quarter, year);

    // 1. Tarik Data Profil dan Transaksi
    const [profile, detailedTransactions] = await Promise.all([
      FinancialReportRepositories.getBusinessProfileForReport(businessId),
      FinancialReportRepositories.getDetailedTransactionsByPeriod(
        businessId,
        start,
        end,
      ),
    ]);

    if (!profile) {
      throw new Error("Data profil bisnis tidak ditemukan di database.");
    }

    // 2. Kalkulasi Laba Rugi
    let totalIncome = 0;
    let totalExpense = 0;
    
    detailedTransactions.forEach((trx) => {
      const type = (trx.type || "").toString().trim().toLowerCase();
      if (type === "income") totalIncome += parseFloat(trx.amount || 0);
      if (type === "expense") totalExpense += parseFloat(trx.amount || 0);
    });
    
    const netIncome = totalIncome - totalExpense;

    // 3. Render HTML menggunakan EJS
    // Sesuaikan path ini jika struktur folder Anda berbeda
    const templatePath = path.join(process.cwd(), "src", "templates", "report-template.ejs");
    
    const htmlContent = await ejs.renderFile(templatePath, {
      profile,
      quarter,
      year,
      totalIncome,
      totalExpense,
      netIncome
    });

    // 4. Konversi HTML menjadi PDF menggunakan Puppeteer
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Mencegah crash di beberapa environment OS
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    
    const pdfBuffer = await page.pdf({ 
      format: "A4", 
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" }
    });

    await browser.close();

    // 5. Rumuskan nama fail
    const fileName = `Rekapin_${profile.business_name.replace(/\s+/g, "_")}_${quarter}_${year}.pdf`;

    return { buffer: pdfBuffer, fileName };
  }
}

export default new FinancialReportService();
