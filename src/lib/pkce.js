// PKCE (Proof Key for Code Exchange) module
import crypto from "crypto";

export const generateCodeVerifier = () => {
  const buffer = crypto.randomBytes(32);
  return base64URLEncode(buffer);
};

export const generateCodeChallenge = (verifier) => {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64URLEncode(hash);
};

export const generateState = () => {
  return crypto.randomBytes(16).toString("hex");
};

const base64URLEncode = (buffer) => {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};