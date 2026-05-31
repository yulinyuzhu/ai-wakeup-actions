# AI Subscription Timer Wakeup (GitHub Actions Edition)

Automatically send messages to AI API providers on a schedule to refresh subscription time limits. Runs on GitHub Actions — zero cost, no server required.

## How It Works

At scheduled times each day, the Action sends a message to each configured AI account. The message arrival resets the subscription time-limit counter.

## Quick Start

1. **Fork this repo**

2. **Set up Secrets**

   Go to `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

   For each account in `accounts.yaml`, add 2 Secrets:

   | Account | Secret 1 | Secret 2 |
   |---------|----------|----------|
   | `codex` | `WAKEUP_CODEX_API_KEY` | `WAKEUP_CODEX_API_URL` |
   | `cc` | `WAKEUP_CC_API_KEY` | `WAKEUP_CC_API_URL` |

   Naming convention: `WAKEUP_<UPPERCASE_NAME>_API_KEY` / `WAKEUP_<UPPERCASE_NAME>_API_URL`

3. **Enable Actions**

   Go to `Actions` → click `I understand my workflows, go ahead and enable them`

4. **Set your timezone**

   Edit `.github/workflows/wakeup.yml` and change `TZ` to your timezone (e.g. `Asia/Shanghai`, `Europe/Berlin`, `America/New_York`). This only affects log timestamps — it does not control the schedule.

5. **Test manually**

   `Actions` → `AI Subscription Timer Wakeup` → `Run workflow` → `Run workflow`

   Check the run log — each account should show `OK`.

## Adding a New Account

1. Edit `config/accounts.yaml`, append a new entry:

```yaml
  - name: "new-account"
    provider: "openai-compatible"
    model: "your-model-id"
    messages:
      - role: "user"
        content: "ping"
```

2. Add 2 Secrets: `WAKEUP_NEW_ACCOUNT_API_KEY` / `WAKEUP_NEW_ACCOUNT_API_URL` (hyphens `-` in the name become `_` in the env var)

3. Push

## Setting Trigger Times

Edit `.github/workflows/wakeup.yml` and find the `cron` entries under `schedule`:

```yaml
on:
  schedule:
    - cron: "0 0 * * *"
    - cron: "1 5 * * *"
    - cron: "2 10 * * *"
    - cron: "3 15 * * *"
```

**GitHub Actions cron runs in UTC.** Convert your desired local time to UTC before writing the cron expression. For example, 10:00 AM China Standard Time is UTC+8 → UTC 02:00 → cron `0 2 * * *`.

The cron format is 5 fields: `minute hour day month weekday` (`*` means every).

**Daylight Saving Time**: If your timezone observes DST, you'll need to adjust the cron values in March and October, or accept a ±1 hour drift.

## Supported Providers

| Provider Value | Description | API_URL |
|----------------|-------------|---------|
| `openai-compatible` | Any OpenAI-compatible endpoint. Works with custom proxies and relays. | Required |
| `openai-responses` | Official OpenAI Responses API | Optional (defaults to `https://api.openai.com/v1`) |
| `anthropic` | Official Anthropic Messages API | Optional (defaults to `https://api.anthropic.com`) |

## Security

- `config/accounts.yaml` contains **no API keys** — safe to commit
- Keys and URLs are injected via GitHub Secrets and automatically masked in logs
- The repo can be public; forked copies do not inherit your Secrets

## License

MIT
