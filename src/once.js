import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { info } from "./logger.js";
import { sendAll } from "./send.js";

const CONFIG_PATH = process.env.ACCOUNTS_PATH || "config/accounts.yaml";

async function main() {
  const raw = await readFile(CONFIG_PATH, "utf8");
  const config = YAML.parse(raw);

  const accounts = config.accounts || [];

  info("=== WAKEUP START ===", {
    count: accounts.length,
    names: accounts.map((a) => a.name),
  });

  const results = await sendAll(accounts);

  const ok = Object.values(results).filter(Boolean).length;
  info("=== WAKEUP DONE ===", { ok, total: accounts.length });

  if (ok !== accounts.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("FATAL:", err?.message || err);
  process.exitCode = 1;
});
