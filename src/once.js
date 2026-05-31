import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { info } from "./logger.js";
import { sendAll } from "./send.js";

const CONFIG_PATH = process.env.ACCOUNTS_PATH || "config/accounts.yaml";

const realConsoleError = console.error.bind(console);

function stripSensitive(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripSensitive);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "url" || k === "baseURL" || k === "requestBodyValues" || k === "responseHeaders") continue;
    out[k] = stripSensitive(v);
  }
  return out;
}

console.error = (...args) => {
  realConsoleError(...args.map((a) => (a instanceof Error ? stripSensitive({ name: a.name, message: a.message, ...a }) : stripSensitive(a))));
};

async function main() {
  const raw = await readFile(CONFIG_PATH, "utf8");
  const config = YAML.parse(raw);
  const entries = config.accounts || [];

  let secrets = [];
  try {
    secrets = JSON.parse(process.env.WAKEUP_ACCOUNTS || "[]");
  } catch {
    console.error("FATAL: WAKEUP_ACCOUNTS is not valid JSON");
    process.exitCode = 1;
    return;
  }

  const accounts = entries.map((entry) => {
    const secret = secrets.find((s) => s.name === entry.name) || {};
    return {
      ...entry,
      api_key: secret.api_key,
      api_url: secret.api_url,
    };
  });

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
