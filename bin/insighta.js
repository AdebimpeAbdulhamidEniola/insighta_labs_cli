#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";

import { loginCommand }          from "../src/commands/login.js";
import { logoutCommand }         from "../src/commands/logout.js";
import { whoamiCommand }         from "../src/commands/whoami.js";
import { profilesListCommand }   from "../src/commands/profiles/list.js";
import { profilesGetCommand }    from "../src/commands/profiles/get.js";
import { profilesSearchCommand } from "../src/commands/profiles/search.js";
import { profilesCreateCommand } from "../src/commands/profiles/create.js";
import { profilesExportCommand } from "../src/commands/profiles/export.js";

const program = new Command();

// ── Root ──────────────────────────────────────────────────────────────────
program
  .name("insighta")
  .description(chalk.bold.cyan("Insighta Labs+") + " — CLI interface")
  .version("1.0.0", "-v, --version", "Print version");

// ── Auth commands ─────────────────────────────────────────────────────────
program
  .command("login")
  .description("Log in via GitHub OAuth (opens browser)")
  .action(loginCommand);

program
  .command("logout")
  .description("Log out and clear local credentials")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show currently logged-in user")
  .action(whoamiCommand);

// ── Profiles sub-command group ────────────────────────────────────────────
const profiles = program
  .command("profiles")
  .description("Manage and query profiles");

profiles
  .command("list")
  .description("List profiles with optional filters")
  .option("--gender <gender>",        "Filter by gender (male/female)")
  .option("--country <code>",         "Filter by country code (e.g. NG)")
  .option("--age-group <group>",      "Filter by age group (e.g. adult, youth)")
  .option("--min-age <number>",       "Minimum age", parseInt)
  .option("--max-age <number>",       "Maximum age", parseInt)
  .option("--sort-by <field>",        "Sort field (e.g. age, name, created_at)")
  .option("--order <direction>",      "Sort direction: asc or desc", "asc")
  .option("--page <number>",          "Page number", parseInt)
  .option("--limit <number>",         "Results per page", parseInt)
  .action(profilesListCommand);

profiles
  .command("get <id>")
  .description("Get a single profile by ID")
  .action(profilesGetCommand);

profiles
  .command("search <query>")
  .description('Natural language search (e.g. "young males from nigeria")')
  .option("--page <number>",  "Page number", parseInt)
  .option("--limit <number>", "Results per page", parseInt)
  .action(profilesSearchCommand);

profiles
  .command("create")
  .description("Create a new profile (admin only)")
  .requiredOption("--name <name>", "Full name for the profile")
  .action(profilesCreateCommand);

profiles
  .command("export")
  .description("Export profiles to a file in the current directory")
  .option("--format <format>",  "Export format (csv)", "csv")
  .option("--gender <gender>",  "Filter by gender")
  .option("--country <code>",   "Filter by country code")
  .action(profilesExportCommand);

// ── Global error handler ──────────────────────────────────────────────────
program.configureOutput({
  outputError: (str, write) => write(chalk.red(str)),
});

// Show help if no command given
if (process.argv.length < 3) {
  program.outputHelp();
  process.exit(0);
}

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red("Fatal error:"), err.message);
  process.exit(1);
});