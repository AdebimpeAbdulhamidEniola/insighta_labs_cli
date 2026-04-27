// Export profiles command
import fs from "fs";
import path from "path";
import { api } from "../../lib/api.js";
import { requireAuth } from "../../lib/auth.js";
import {
  createSpinner,
  printSuccess,
  printError,
  extractErrorMessage,
} from "../../lib/display.js";
import chalk from "chalk";

export const profilesExportCommand = async (options) => {
  await requireAuth();

  const format = options.format || "csv";

  if (format !== "csv") {
    printError(`Unsupported format "${format}". Currently only "csv" is supported.`);
    process.exit(1);
  }

  const spinner = createSpinner("Exporting profiles...").start();

  // Build optional filters
  const params = { format };
  if (options.gender)  params.gender  = options.gender;
  if (options.country) params.country = options.country;

  try {
    const response = await api.get("/api/profiles/export", {
      params,
      responseType: "text", // raw CSV text
    });

    spinner.stop();

    // Save to current working directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `insighta-profiles-${timestamp}.csv`;
    const outputPath = path.join(process.cwd(), filename);

    fs.writeFileSync(outputPath, response.data, "utf-8");

    printSuccess(
      `Exported to: ` + chalk.cyan(outputPath)
    );
  } catch (err) {
    spinner.fail("Export failed");
    printError(extractErrorMessage(err));
    process.exit(1);
  }
};