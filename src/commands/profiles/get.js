// Get profile command
import { api } from "../../lib/api.js";
import { requireAuth } from "../../lib/auth.js";
import {
  createSpinner,
  printProfileDetail,
  printError,
  extractErrorMessage,
} from "../../lib/display.js";

export const profilesGetCommand = async (id) => {
  await requireAuth();

  if (!id) {
    printError("Profile ID is required. Usage: insighta profiles get <id>");
    process.exit(1);
  }

  const spinner = createSpinner(`Fetching profile ${id}...`).start();

  try {
    const response = await api.get(`/api/profiles/${id}`);
    spinner.stop();

    printProfileDetail(response.data.data);
  } catch (err) {
    spinner.fail("Failed to fetch profile");
    const status = err?.response?.status;
    if (status === 404) {
      printError(`Profile with ID "${id}" not found.`);
    } else {
      printError(extractErrorMessage(err));
    }
    process.exit(1);
  }
};