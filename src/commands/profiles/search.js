// Search profiles command
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
import chalk from "chalk";

export const profilesSearchCommand = async (query, options) => {
  await requireAuth();

  if (!query || query.trim() === "") {
    printError('A search query is required. Usage: insighta profiles search "your query"');
    process.exit(1);
  }

  const spinner = createSpinner(`Searching: "${query}"...`).start();

  try {
    const response = await api.get("/api/profiles/search", {
      params: {
        q: query,
        page: options.page || 1,
        limit: options.limit || 10,
      },
    });
    spinner.stop();

    const { data, page, limit, total } = response.data;

    if (!data || data.length === 0) {
      printWarning(`No profiles found for: "${query}"`);
      return;
    }

    console.log();
    console.log(chalk.dim(`  Results for: `) + chalk.cyan(`"${query}"`));
    console.log();
    printProfilesTable(data);
    console.log();
    printPagination({ page, limit, total });
    console.log();
  } catch (err) {
    spinner.fail("Search failed");
    printError(extractErrorMessage(err));
    process.exit(1);
  }
};