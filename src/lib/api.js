// API module
import axios from "axios";
import { config } from "../config.js";
import {
  readCredentials,
  refreshTokens,
  clearCredentials,
} from "./auth.js";

/**
 * Creates a pre-configured axios instance that:
 * - Attaches Bearer token to every request
 * - Attaches X-API-Version header to every request
 * - On 401: attempts one token refresh and retries
 * - On second 401: clears credentials and exits
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
      "X-API-Version": "1",
    },
  });

  // Request interceptor — attach current access token
  client.interceptors.request.use((requestConfig) => {
    const creds = readCredentials();
    if (creds?.access_token) {
      requestConfig.headers["Authorization"] = `Bearer ${creds.access_token}`;
    }
    return requestConfig;
  });

  // Response interceptor — handle 401 with one refresh attempt
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retried) {
        originalRequest._retried = true;

        const newCreds = await refreshTokens();

        if (newCreds) {
          // Retry original request with new token
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${newCreds.access_token}`;
          return client(originalRequest);
        }

        // Refresh also failed — session is dead
        clearCredentials();
        const chalk = (await import("chalk")).default;
        console.error(
          chalk.red("\n✖ Session expired.") + " Please run: insighta login"
        );
        process.exit(1);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const api = createApiClient();