import { api } from "./api";

const buildQueryString = (quarter, year) => {
  const params = new URLSearchParams();
  if (quarter) params.set("quarter", quarter);
  if (year) params.set("year", String(year));
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const buildReportQuery = (quarter, year) => {
  const params = new URLSearchParams();
  if (quarter) params.set("quarter", quarter);
  if (year) params.set("year", String(year));
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export async function getFinancialSummary(businessId, quarter, year) {
  const query = buildReportQuery(quarter, year);
  const response = await api.get(
    `/reports/${businessId}/financial-summary${query}`,
  );
  return response.data;
}

export async function getIncomeStatement(businessId, quarter, year) {
  const query = buildReportQuery(quarter, year);
  const response = await api.get(
    `/reports/${businessId}/income-statement${query}`,
  );
  return response.data;
}

export async function getRevenueForecast(businessId) {
  const response = await api.get(`/reports/${businessId}/revenue-forecast`);
  return response.data;
}

export async function exportReportExcel(businessId, quarter, year) {
  const query = buildQueryString(quarter, year);
  return await api.get(`/reports/${businessId}/export/excel${query}`, {
    responseType: "blob",
  });
}

export async function exportReportPDF(businessId, quarter, year) {
  const query = buildQueryString(quarter, year);
  return await api.get(`/reports/${businessId}/export/pdf${query}`, {
    responseType: "blob",
  });
}
