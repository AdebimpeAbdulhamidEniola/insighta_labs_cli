// Whoami command
import { api } from "../lib/api.js";
import { requireAuth } from "../lib/auth.js";
import {
  createSpinner,
  printError,
  printInfo,
  extractErrorMessage,
} from "../lib/display.js";
import chalk from "chalk";

export const whoamiCommand = async () => {
  await requireAuth();

  const spinner = createSpinner("Fetching your profile...").start();

  try {
    const response = await api.get("/auth/me");
    spinner.stop();

    const user = response.data;

    console.log();
    console.log(chalk.bold.cyan("  Logged in as"));
    console.log(chalk.grey("  " + "─".repeat(36)));
    printInfo("  Username:", `@${user.username}`);
    printInfo("  Email:", user.email);
    printInfo(
      "  Role:",
      user.role === "admin"
        ? chalk.red(user.role)
        : chalk.blue(user.role)
    );
    printInfo("  Status:", user.is_active ? chalk.green("active") : chalk.red("deactivated"));
    printInfo("  Member since:", new Date(user.created_at).toLocaleDateString());
    console.log();
  } catch (err) {
    spinner.fail("Failed to fetch user info");
    printError(extractErrorMessage(err));
    process.exit(1);
  }
};