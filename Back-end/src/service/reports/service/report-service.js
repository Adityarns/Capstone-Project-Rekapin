import FinancialReportRepositories from "../repositories/report-repositories.js";
import excelJS from "exceljs";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";

const calculateVariance = (current, previous) => {
  if (!previous || previous === 0) {
    if (current > 0) return 100.0;
    if (current < 0) return -100.0;
    return 0.0;
  }

  if (current === 0 && previous !== 0) {
    return -100.0;
  }

  const variance = ((current - previous) / Math.abs(previous)) * 100;

  return parseFloat(variance.toFixed(1));
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

    // Fungsi utilitas untuk mengambil nominal berdasarkan nama kategori
    const getAmount = (data, catName) =>
      parseFloat(
        data.find((d) => d.category_name === catName)?.total_amount || 0,
      );

    // 1. Kalkulasi Pendapatan (Semua transaksi 'income')
    const currentRev = currentData
      .filter((d) => d.type === "income")
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    const prevRev = prevData
      .filter((d) => d.type === "income")
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

    // 2. Kalkulasi HPP/COGS (Pengecualian khusus untuk beban pokok)
    const isCogs = (name) =>
      name.toLowerCase() === "hpp" || name.toLowerCase() === "cogs";
    const currentCogs = currentData
      .filter((d) => isCogs(d.category_name))
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    const prevCogs = prevData
      .filter((d) => isCogs(d.category_name))
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

    // 3. Mengumpulkan SEMUA nama kategori pengeluaran yang unik (Operating Expenses)
    const opexCategories = new Set();
    const extractOpexCategories = (data) => {
      data.forEach((d) => {
        if (d.type === "expense" && !isCogs(d.category_name)) {
          opexCategories.add(d.category_name);
        }
      });
    };
    extractOpexCategories(currentData);
    extractOpexCategories(prevData);

    // 4. Membangun objek operating_expenses secara dinamis
    const operating_expenses = {};
    let currentTotalOp = 0;
    let prevTotalOp = 0;

    opexCategories.forEach((catName) => {
      const currVal = getAmount(currentData, catName);
      const prevVal = getAmount(prevData, catName);

      operating_expenses[catName] = {
        current: currVal,
        previous: prevVal,
        variance: calculateVariance(currVal, prevVal),
      };

      currentTotalOp += currVal;
      prevTotalOp += prevVal;
    });

    // 5. Kalkulasi Akhir
    const currentGross = currentRev - currentCogs;
    const prevGross = prevRev - prevCogs;
    const currentNet = currentGross - currentTotalOp;
    const prevNet = prevGross - prevTotalOp;

    return {
      metadata: {
        current_quarter: `${quarter} ${year}`,
        previous_quarter: `${prevQ.quarter} ${prevQ.year}`,
      },
      statement: {
        revenues: {
          current: currentRev,
          previous: prevRev,
          variance: calculateVariance(currentRev, prevRev),
        },
        cogs: {
          current: currentCogs,
          previous: prevCogs,
          variance: calculateVariance(currentCogs, prevCogs),
        },
        gross_profit: {
          current: currentGross,
          previous: prevGross,
          variance: calculateVariance(currentGross, prevGross),
        },
        operating_expenses, // <-- Objek dinamis langsung disisipkan di sini
        total_operating_expenses: {
          current: currentTotalOp,
          previous: prevTotalOp,
          variance: calculateVariance(currentTotalOp, prevTotalOp),
        },
        net_income: {
          current: currentNet,
          previous: prevNet,
          variance: calculateVariance(currentNet, prevNet),
        },
      },
    };
  }

  async generateExcelReport({ businessId, quarter, year }) {
    const { start, end } = getQuarterDateRange(quarter, year);

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

    // 1. Logika Pengelompokan Akuntansi
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseDetails = {};

    detailedTransactions.forEach((trx) => {
      const type = (trx.type || "").toString().trim().toLowerCase();
      const amount = parseFloat(trx.amount || 0);
      const cat = trx.category || "Uncategorized";

      if (type === "income") {
        totalIncome += amount;
      }
      if (type === "expense") {
        totalExpense += amount;
        expenseDetails[cat] = (expenseDetails[cat] || 0) + amount;
      }
    });

    const netProfit = totalIncome - totalExpense;

    // 2. Inisialisasi Buku Kerja Excel
    const workbook = new excelJS.Workbook();
    workbook.creator = "Rekapin System";
    const sheet1 = workbook.addWorksheet("Financial Statement");

    sheet1.getColumn(1).width = 45;
    sheet1.getColumn(2).width = 25;

    // Format angka: Positif biasa, Negatif pakai kurung ( )
    const accountingFormat = "#,##0;(#,##0)";

    // Header Laporan
    sheet1.getCell("A1").value = profile.business_name.toUpperCase();
    sheet1.getCell("A1").font = { size: 14, bold: true };
    sheet1.getCell("A2").value =
      `Financial Statement - Quarter ${quarter} ${year}`;
    sheet1.addRow([]);

    // --- BAGIAN 1: INCOME STATEMENT ---
    const title1 = sheet1.addRow(["1. Income statement"]);
    title1.font = { bold: true };
    sheet1.addRow([]);

    const incomeRow = sheet1.addRow(["Fees Earned", totalIncome]);
    incomeRow.font = { bold: true };
    incomeRow.getCell(2).numFmt = accountingFormat;

    // Di Income Statement, rincian beban tidak lagi dijabarkan, langsung totalnya (dibikin minus)
    const totalExpRow1 = sheet1.addRow(["Total Expense", -totalExpense]);
    totalExpRow1.font = { bold: true };
    totalExpRow1.getCell(2).numFmt = accountingFormat;

    const netRow = sheet1.addRow(["Nett Profit", netProfit]);
    netRow.font = { bold: true };
    netRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };
    netRow.getCell(2).numFmt = accountingFormat;

    sheet1.addRow([]);
    sheet1.addRow([]);

    // --- BAGIAN 2: EXPENSE STATEMENT (BARU) ---
    const title2 = sheet1.addRow(["2. Expense Statement"]);
    title2.font = { bold: true };
    sheet1.addRow([]);

    sheet1.addRow(["Category", "Amount"]).font = { italic: true, bold: true };

    // Looping rincian beban (ditampilkan sebagai angka positif karena ini laporan rincian)
    for (const [category, amount] of Object.entries(expenseDetails)) {
      const row = sheet1.addRow([`     ${category}`, amount]);
      row.getCell(2).numFmt = accountingFormat;
    }

    const totalExpRow2 = sheet1.addRow([
      "Total Operating Expenses",
      totalExpense,
    ]);
    totalExpRow2.font = { bold: true };
    totalExpRow2.getCell(2).numFmt = accountingFormat;

    sheet1.addRow([]);
    sheet1.addRow([]);

    // --- BAGIAN 3: STATEMENT OF CHANGES EQUITY ---
    const title3 = sheet1.addRow(["3. Statement of Changes Equity"]);
    title3.font = { bold: true };
    sheet1.addRow([]);

    const beginningEquity = 0;
    const paidInCapital = 500000000;
    const drawing = -5000000;
    const endingEquity = beginningEquity + paidInCapital + drawing + netProfit;

    sheet1
      .addRow(["Beginning of the year :", beginningEquity])
      .getCell(2).numFmt = accountingFormat;
    sheet1.addRow([]);

    sheet1.addRow(["Change during years in Owners Equity :"]).font = {
      italic: true,
    };
    sheet1
      .addRow(["     +/+ Paid in Capital", paidInCapital])
      .getCell(2).numFmt = accountingFormat;
    sheet1.addRow(["     -/- Drawing", drawing]).getCell(2).numFmt =
      accountingFormat;
    sheet1
      .addRow(["     +/+ Income from Operations", netProfit])
      .getCell(2).numFmt = accountingFormat;

    sheet1.addRow([]);
    const endRow = sheet1.addRow(["Ending of Year :", endingEquity]);
    endRow.font = { bold: true };
    endRow.getCell(2).numFmt = accountingFormat;

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Rekapin_Statement_${profile.business_name.replace(/\s+/g, "_")}_${quarter}_${year}.xlsx`;

    return { buffer, fileName };
  }

  async generatePDFReport({ businessId, quarter, year }) {
    const { start, end } = getQuarterDateRange(quarter, year);

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

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseDetails = {};

    detailedTransactions.forEach((trx) => {
      const type = (trx.type || "").toString().trim().toLowerCase();
      const amount = parseFloat(trx.amount || 0);
      const cat = trx.category || "Uncategorized";

      if (type === "income") totalIncome += amount;
      if (type === "expense") {
        totalExpense += amount;
        expenseDetails[cat] = (expenseDetails[cat] || 0) + amount;
      }
    });

    const netProfit = totalIncome - totalExpense;

    const beginningEquity = 0;
    const paidInCapital = 500000000;
    const drawing = -5000000;
    const endingEquity = beginningEquity + paidInCapital + drawing + netProfit;

    const formatNumber = (num) => {
      return Number(num).toLocaleString("id-ID", { minimumFractionDigits: 0 });
    };

    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      "report-template.ejs",
    );

    const htmlContent = await ejs.renderFile(templatePath, {
      profile,
      quarter,
      year,
      totalIncome,
      totalExpense,
      netProfit,
      expenseDetails,
      beginningEquity,
      paidInCapital,
      drawing,
      endingEquity,
      formatNumber,
    });

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
    });

    await browser.close();

    const fileName = `Rekapin_${profile.business_name.replace(/\s+/g, "_")}_${quarter}_${year}.pdf`;

    return { buffer: pdfBuffer, fileName };
  }
}

export default new FinancialReportService();
