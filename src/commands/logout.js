// Logout command
import { api } from "../lib/api.js";
import { clearCredentials, readCredentials } from "../lib/auth.js";
import { createSpinner, printSuccess, printError } from "../lib/display.js";

export const logoutCommand = async () => {
  const creds = readCredentials();
  if (!creds?.access_token) {
    printError("You are not logged in.");
    process.exit(1);
  }

  const spinner = createSpinner("Logging out...").start();

  try {
    await api.post("/auth/logout");
    spinner.stop();
  } catch (err) {
    // Even if the server call fails, clear local credentials
    spinner.stop();
    const status = err?.response?.status;
    if (status !== 401) {
      // 401 just means token was already expired — still log out locally
      printError(
        "Server logout failed: " +
          (err?.response?.data?.message || err.message)
      );
    }
  }

  clearCredentials();
  printSuccess("Logged out successfully.");
};