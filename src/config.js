// Configuration module
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
  credentialsPath: join(
    process.env.HOME || process.env.USERPROFILE || "~",
    ".insighta",
    "credentials.json"
  ),
  callbackPort: parseInt(process.env.CLI_CALLBACK_PORT || "9876"),
  callbackPath: "/callback",
};