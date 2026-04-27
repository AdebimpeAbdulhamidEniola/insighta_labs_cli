// Authentication module
import fs from "fs";
import path from "path";
import { config } from "../config.js";

/**
 * Read credentials from ~/.insighta/credentials.json
 * Returns null if file doesn't exist or is malformed.
 */
export const readCredentials = () => {
  try {
    if (!fs.existsSync(config.credentialsPath)) return null;
    const raw = fs.readFileSync(config.credentialsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Write credentials to ~/.insighta/credentials.json
 * Creates the directory if it doesn't exist.
 */
export const writeCredentials = (credentials) => {
  const dir = path.dirname(config.credentialsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(
    config.credentialsPath,
    JSON.stringify(credentials, null, 2),
    { mode: 0o600 } // owner-read-only for security
  );
};

/**
 * Clear stored credentials (logout).
 */
export const clearCredentials = () => {
  if (fs.existsSync(config.credentialsPath)) {
    fs.unlinkSync(config.credentialsPath);
  }
};

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new credentials on success, null on failure.
 */
export const refreshTokens = async () => {
  const creds = readCredentials();
  if (!creds?.refresh_token) return null;

  try {
    const { default: axios } = await import("axios");
    const response = await axios.post(
      `${config.apiBaseUrl}/auth/refresh`,
      { refresh_token: creds.refresh_token },
      { headers: { "Content-Type": "application/json" } }
    );

    const { access_token, refresh_token } = response.data;
    const newCreds = {
      ...creds,
      access_token,
      refresh_token,
    };
    writeCredentials(newCreds);
    return newCreds;
  } catch {
    return null;
  }
};

/**
 * Get a valid access token.
 * Auto-refreshes if needed. Returns null if not authenticated.
 */
export const getValidAccessToken = async () => {
  const creds = readCredentials();
  if (!creds?.access_token) return null;

  // Optimistically try to use the existing token.
  // The API interceptor in api.js handles 401s and retries once.
  return creds.access_token;
};

/**
 * Require authentication — exit with a helpful message if not logged in.
 */
export const requireAuth = async () => {
  const token = await getValidAccessToken();
  if (!token) {
    const chalk = (await import("chalk")).default;
    console.error(chalk.red("✖ Not logged in.") + " Run: insighta login");
    process.exit(1);
  }
  return token;
};