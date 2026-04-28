// Login command
import http from "http";
import { config } from "../config.js";
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
} from "../lib/pkce.js";
import { writeCredentials } from "../lib/auth.js";
import { createSpinner, printSuccess, printError } from "../lib/display.js";
import chalk from "chalk";
import axios from "axios";
import open from "open";

export const loginCommand = async () => {
  // ── 1. Generate PKCE values ──────────────────────────────────────────
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // ── 2. Build GitHub authorization URL via your backend ───────────────
  //    We construct it client-side so we can supply our own redirect_uri
  //    pointing at the local callback server.
  const callbackUrl = `http://localhost:${config.callbackPort}${config.callbackPath}`;

  // Ask the backend for the base GitHub OAuth URL params — but since
  // /auth/github does a redirect (for web flow), we build the URL
  // ourselves using the same parameters the backend uses.
  // The CLI callback endpoint is POST /auth/cli/callback.
  const githubAuthUrl = buildGitHubUrl(state, codeChallenge, callbackUrl);

  // ── 3. Start local callback server ───────────────────────────────────
  let resolveCallback, rejectCallback;
  const callbackPromise = new Promise((res, rej) => {
    resolveCallback = res;
    rejectCallback = rej;
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${config.callbackPort}`);

    if (url.pathname !== config.callbackPath) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Send a friendly HTML response to the browser
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(callbackHtml(error ? false : true));

    server.close();

    if (error || !code) {
      rejectCallback(new Error(error || "Authorization denied"));
      return;
    }

    if (returnedState !== state) {
      rejectCallback(new Error("State mismatch — possible CSRF attack"));
      return;
    }

    resolveCallback(code);
  });

  server.listen(config.callbackPort);

  // Handle server errors (e.g. port already in use)
  server.on("error", (err) => {
    rejectCallback(err);
  });

  // ── 4. Open GitHub in the browser ────────────────────────────────────
  console.log();
  console.log(chalk.bold("  Insighta Labs+ Login"));
  console.log(chalk.grey("  " + "─".repeat(36)));
  console.log(chalk.dim("  Opening GitHub in your browser..."));
  console.log();

  await open(githubAuthUrl);

  const spinner = createSpinner("Waiting for GitHub authorization...").start();

  // ── 5. Wait for the callback ──────────────────────────────────────────
  let code;
  try {
    // Timeout after 2 minutes
    code = await Promise.race([
      callbackPromise,
      timeout(120_000, "Authorization timed out after 2 minutes"),
    ]);
  } catch (err) {
    spinner.fail(err.message);
    server.close();
    process.exit(1);
  }

  spinner.text = "Exchanging code with backend...";

  // ── 6. Send code + code_verifier to your backend ─────────────────────
  let tokens;
  try {
    const response = await axios.post(
      `${config.apiBaseUrl}/auth/cli/callback`,
      { 
        code, 
        code_verifier: codeVerifier,
        redirect_uri: callbackUrl
      },
      { headers: { "Content-Type": "application/json" } }
    );
    tokens = response.data;
  } catch (err) {
    spinner.fail(
      "Backend token exchange failed: " +
        (err?.response?.data?.message || err.message)
    );
    process.exit(1);
  }

  // ── 7. Store tokens locally ───────────────────────────────────────────
  const credentials = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  };
  writeCredentials(credentials);

  // ── 8. Fetch user info to confirm login ──────────────────────────────
  let username = "unknown";
  try {
    const { api } = await import("../lib/api.js");
    const meResponse = await api.get("/auth/me");
    username = meResponse.data?.username || "unknown";
  } catch {
    // non-fatal — we still logged in
  }

  spinner.stop();
  console.log();
  printSuccess(
    chalk.bold(`Logged in as `) + chalk.cyan(`@${username}`)
  );
  console.log();
};

// ── Helpers ────────────────────────────────────────────────────────────────

const buildGitHubUrl = (state, codeChallenge, redirectUri) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    printError(
      "GITHUB_CLIENT_ID is not set in your .env file.\n" +
        "  Create a .env file with: GITHUB_CLIENT_ID=your_client_id"
    );
    process.exit(1);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

const timeout = (ms, message) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );

const callbackHtml = (success) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Insighta Labs+</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; height: 100vh; margin: 0; background: #0d1117; color: #c9d1d9; }
    .card { text-align: center; padding: 2rem; border: 1px solid #30363d;
            border-radius: 12px; max-width: 360px; }
    h2 { color: ${success ? "#3fb950" : "#f85149"}; margin-bottom: .5rem; }
    p  { color: #8b949e; font-size: .95rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${success ? "✔ Login Successful" : "✖ Login Failed"}</h2>
    <p>${success ? "You can close this tab and return to the terminal." : "Something went wrong. Please try again."}</p>
  </div>
</body>
</html>`;
