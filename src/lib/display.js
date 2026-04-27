// Display module
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";

/**
 * Creates and returns an ora spinner.
 */
export const createSpinner = (text) => {
  return ora({ text, color: "cyan" });
};

/**
 * Print a success message.
 */
export const printSuccess = (msg) => {
  console.log(chalk.green("✔") + " " + msg);
};

/**
 * Print an error message.
 */
export const printError = (msg) => {
  console.error(chalk.red("✖") + " " + msg);
};

/**
 * Print a warning message.
 */
export const printWarning = (msg) => {
  console.warn(chalk.yellow("⚠") + " " + msg);
};

/**
 * Print a formatted info line.
 */
export const printInfo = (label, value) => {
  console.log(chalk.cyan(label.padEnd(16)) + chalk.white(value ?? "—"));
};

/**
 * Render an array of profile objects as a rich table.
 */
export const printProfilesTable = (profiles) => {
  if (!profiles || profiles.length === 0) {
    console.log(chalk.yellow("No profiles found."));
    return;
  }

  const table = new Table({
    head: [
      chalk.bold.cyan("ID"),
      chalk.bold.cyan("Name"),
      chalk.bold.cyan("Gender"),
      chalk.bold.cyan("Age"),
      chalk.bold.cyan("Age Group"),
      chalk.bold.cyan("Country"),
    ],
    colWidths: [38, 22, 10, 6, 12, 14],
    style: { head: [], border: ["grey"] },
    wordWrap: true,
  });

  for (const p of profiles) {
    table.push([
      chalk.dim(p.id),
      chalk.white(p.name),
      p.gender === "male" ? chalk.blue(p.gender) : chalk.magenta(p.gender),
      String(p.age ?? "—"),
      chalk.dim(p.age_group ?? "—"),
      chalk.yellow(p.country_name ?? p.country_id ?? "—"),
    ]);
  }

  console.log(table.toString());
};

/**
 * Render a single profile as a detail card.
 */
export const printProfileDetail = (p) => {
  console.log();
  console.log(chalk.bold.cyan("  Profile Detail"));
  console.log(chalk.grey("  " + "─".repeat(40)));
  printInfo("  ID:", p.id);
  printInfo("  Name:", p.name);
  printInfo("  Gender:", p.gender);
  printInfo("  Age:", String(p.age ?? "—"));
  printInfo("  Age Group:", p.age_group);
  printInfo("  Country:", p.country_name ?? p.country_id);
  printInfo("  Created:", new Date(p.created_at).toLocaleString());
  console.log();
};

/**
 * Render pagination metadata.
 */
export const printPagination = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  console.log(
    chalk.dim(
      `  Page ${page} of ${totalPages} · ${total} total result${total !== 1 ? "s" : ""}`
    )
  );
};

/**
 * Extract a human-readable error message from an axios error.
 */
export const extractErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred"
  );
};