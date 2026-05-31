import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { error, info } from "./logger.js";

function normalizeModel(model) {
  if (model.startsWith("openai/chat_completions/")) {
    return model.slice("openai/chat_completions/".length);
  }
  if (model.startsWith("openai/")) {
    return model.slice("openai/".length);
  }
  return model;
}

function serializeError(err) {
  return {
    name: err?.name,
    message: err?.message || String(err),
    url: maskURL(err?.url),
    statusCode: err?.statusCode || err?.status,
    responseBody: err?.responseBody,
    parts: err?.parts,
    finishReason: err?.finishReason,
    usage: err?.usage,
  };
}

function maskURL(url) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return String(url).split("/").slice(0, 3).join("/");
  }
}

function createModel(account, model, baseURL, apiKey) {
  const p = account.provider || "openai-compatible";

  if (p === "openai-responses") {
    const o = createOpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    return o.responses(model);
  }
  if (p === "anthropic") {
    const a = createAnthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
    return a(model);
  }
  return createOpenAICompatible({
    name: account.name || "openai-compatible",
    apiKey,
    baseURL,
    includeUsage: true,
  })(model);
}

export async function sendAll(accounts) {
  const results = {};

  for (const account of accounts) {
    const name = account.name || "unnamed";
    const model = normalizeModel(account.model);
    const provider = account.provider || "openai-compatible";
    const apiKey = account.api_key;
    const baseURL = account.api_url;

    if (!apiKey) {
      await error(`[${name}] missing api_key in WAKEUP_ACCOUNTS`);
      results[name] = false;
      continue;
    }

    if (provider === "openai-compatible" && !baseURL) {
      await error(`[${name}] missing api_url in WAKEUP_ACCOUNTS`);
      results[name] = false;
      continue;
    }

    try {
      const result = streamText({
        model: createModel(account, model, baseURL, apiKey),
        messages: account.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      let text = "";
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") text += part.text;
        if (part.type === "error") throw part.error;
      }

      if (text.length === 0) throw new Error("Empty response stream");

      await info(`[${name}] OK`, {
        model,
        provider,
        baseURL: maskURL(baseURL),
        chars: text.length,
        response: text.slice(0, 120).replace(/\s+/g, " "),
      });
      results[name] = true;
    } catch (err) {
      await error(`[${name}] FAIL`, {
        model,
        provider,
        baseURL: maskURL(baseURL),
        ...serializeError(err),
      });
      results[name] = false;
    }
  }

  return results;
}
