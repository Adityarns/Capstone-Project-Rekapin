import CarbonRepositories from "../repositories/carbon-repositories.js";
import { calculateCarbonWithAI } from "../../models/ai-service.js";
import response from "../../../utils/response.js";
import { NotFoundError } from "../../../exceptions/index.js";
import { GREEN_INSIGHTS_BANK } from "../../carbon/insights/insights.js";
import CacheService from "../../cache/redis-cache.js";

const cacheService = new CacheService();

export const getCarbonSummary = async (req, res, next) => {
  const { businessId } = req.params;

  const cacheKey = `carbonSummary_${businessId}`;
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    res.setHeader("X-Data-Source", "cache");
    const parsedData =
      typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    return response(
      res,
      200,
      "Carbon summary berhasil diambil (cache)",
      parsedData,
    );
  }
  const summary = await CarbonRepositories.getCarbonSummary(businessId);
  if (!summary) {
    return next(
      new NotFoundError("Carbon summary tidak ditemukan untuk bisnis ini"),
    );
  }
  const insights = [];

  if (summary.breakdown && summary.breakdown.length > 0) {
    const topCategory = summary.breakdown[0].category;
    const status = summary.change_percent > 0 ? "worse" : "better";

    if (GREEN_INSIGHTS_BANK[topCategory]) {
      insights.push({
        icon: topCategory === "Electricity" ? "lightning" : "Transportation",
        title: GREEN_INSIGHTS_BANK[topCategory][status].title,
        description: GREEN_INSIGHTS_BANK[topCategory][status].description,
      });
    }
  }

  insights.push({
    icon: "recycle",
    title: GREEN_INSIGHTS_BANK.General.title,
    description: GREEN_INSIGHTS_BANK.General.description,
  });
  await cacheService.set(cacheKey, JSON.stringify({ ...summary, insights }));
  res.setHeader("X-Data-Source", "database");
  return response(res, 200, "Carbon summary berhasil diambil", {
    ...summary,
    insights,
  });
};

export const getCarbonLogs = async (req, res, next) => {
  const { businessId } = req.params;
  const cacheKey = `carbonLogs_${businessId}`;
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    res.setHeader("X-Data-Source", "cache");
    const parsedData =
      typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    return response(
      res,
      200,
      "Carbon logs berhasil diambil (cache)",
      parsedData,
    );
  }
  const logs = await CarbonRepositories.getCarbonLogsByBusinessId(businessId);

  await cacheService.set(cacheKey, JSON.stringify({ logs }));
  res.setHeader("X-Data-Source", "database");
  return response(res, 200, "Carbon logs berhasil diambil", { logs });
};
