// List profiles command
import { api } from "../../lib/api.js";
import { requireAuth } from "../../lib/auth.js";
import {
  createSpinner,
  printProfilesTable,
  printPagination,
  printError,
  printWarning,
  extractErrorMessage,
} from "../../lib/display.js";

export const profilesListCommand = async (options) => {
  await requireAuth();

  const spinner = createSpinner("Fetching profiles...").start();

  // Build query params from CLI flags
  const params = {};
  if (options.gender)   params.gender   = options.gender;
  if (options.country)  params.country  = options.country;
  if (options.ageGroup) params.age_group = options.ageGroup;
  if (options.minAge)   params.min_age  = options.minAge;
  if (options.maxAge)   params.max_age  = options.maxAge;
  if (options.sortBy)   params.sort_by  = options.sortBy;
  if (options.order)    params.order    = options.order;
  if (options.page)     params.page     = options.page;
  if (options.limit)    params.limit    = options.limit;

  try {
    const response = await api.get("/api/profiles", { params });
    spinner.stop();

    const { data, page, limit, total } = response.data;

    if (!data || data.length === 0) {
      printWarning("No profiles match your filters.");
      return;
    }

    console.log();
    printProfilesTable(data);
    console.log();
    printPagination({ page, limit, total });
    console.log();
  } catch (err) {
    spinner.fail("Failed to fetch profiles");
    printError(extractErrorMessage(err));
    process.exit(1);
  }
};