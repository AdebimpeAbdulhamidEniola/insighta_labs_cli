// Create profile command
import { api } from "../../lib/api.js";
import { requireAuth } from "../../lib/auth.js";
import {
  createSpinner,
  printProfileDetail,
  printSuccess,
  printError,
  extractErrorMessage,
} from "../../lib/display.js";
import chalk from "chalk";

export const profilesCreateCommand = async (options) => {
  await requireAuth();

  if (!options.name || options.name.trim() === "") {
    printError('A name is required. Usage: insighta profiles create --name "Full Name"');
    process.exit(1);
  }

  const spinner = createSpinner(
    `Creating profile for "${options.name}"...`
  ).start();

  try {
    const response = await api.post("/api/profiles", {
      name: options.name.trim(),
    });
    spinner.stop();

    printSuccess(
      `Profile created: ` + chalk.cyan(options.name)
    );
    printProfileDetail(response.data.data);
  } catch (err) {
    spinner.fail("Failed to create profile");
    const status = err?.response?.status;
    if (status === 403) {
      printError("Only admins can create profiles.");
    } else if (status === 409) {
      printError(`A profile with the name "${options.name}" already exists.`);
    } else {
      printError(extractErrorMessage(err));
    }
    process.exit(1);
  }
};