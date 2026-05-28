import FinancialReportRepositories from "../repositories/report-repositories.js";

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

    const currentRevenue = currentData
      .filter((d) => d.type === "income")
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    const currentExpense = currentData
      .filter((d) => d.type === "expense")
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    const prevRevenue = prevData
      .filter((d) => d.type === "income")
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    const prevExpense = prevData
      .filter((d) => d.type === "expense")
      .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

    return {
      summary: {
        total_revenue: currentRevenue,
        revenue_variance_percent: calculateVariance(
          currentRevenue,
          prevRevenue,
        ),
        net_income: currentRevenue - currentExpense,
        net_income_variance_percent: calculateVariance(
          currentRevenue - currentExpense,
          prevRevenue - prevExpense,
        ),
        carbon_footprint_tons: parseFloat(
          (parseFloat(currentCarbon.total_carbon) / 1000).toFixed(6),
        ),
        carbon_variance_percent: calculateVariance(
          parseFloat(currentCarbon.total_carbon),
          parseFloat(prevCarbon.total_carbon),
        ),
        is_carbon_on_track:
          parseFloat(currentCarbon.total_carbon) <=
          parseFloat(prevCarbon.total_carbon),
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
      const totalExp = data
        .filter((d) => d.type === "expense")
        .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
      const other = totalExp - (cogs + sal + rent + util);
      return {
        rev,
        cogs,
        gross: rev - cogs,
        sal,
        rent,
        util,
        other,
        totalOp: sal + rent + util + other,
        net: rev - cogs - (sal + rent + util + other),
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
}

export default new FinancialReportService();
