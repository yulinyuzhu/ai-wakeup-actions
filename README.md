# AI Subscription Timer Wakeup（GitHub Actions 版）

[English Version](README_en.md)

定时向 AI 服务商发送消息，刷新订阅账户的时间限额。通过 GitHub Actions 免费运行，无需服务器。

## 工作原理

在每天指定的时间触发，向配置的 AI 账户发送消息。消息到达即刷新限额计时器。

## 快速开始

1. **Fork 本仓库**

2. **设置 Secrets**

   仓库 `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

   `accounts.yaml` 里有几个账户，每个账户需要 2 个 Secret：

   | 账户名 | Secret 1 | Secret 2 |
   |--------|----------|----------|
   | `codex` | `WAKEUP_CODEX_API_KEY` | `WAKEUP_CODEX_API_URL` |
   | `cc` | `WAKEUP_CC_API_KEY` | `WAKEUP_CC_API_URL` |

   命名规则：`WAKEUP_<名字大写>_API_KEY` / `WAKEUP_<名字大写>_API_URL`

3. **启用 Actions**

   仓库 `Actions` → 点 `I understand my workflows, go ahead and enable them`

4. **设置你的时区**

   编辑 `.github/workflows/wakeup.yml`，把 `TZ` 改成你的时区（可用 `Asia/Shanghai`、`Europe/Berlin`、`America/New_York` 等），这个值只影响日志时间戳。

5. **手动测试**

   `Actions` → `AI Subscription Timer Wakeup` → `Run workflow` → `Run workflow`

   查看运行日志确认每个账户返回 OK。

## 添加新账户

1. 编辑 `config/accounts.yaml`，在 `accounts` 列表末尾追加一段：

```yaml
  - name: "new-account"
    provider: "openai-compatible"
    model: "your-model-id"
    messages:
      - role: "user"
        content: "ping"
```

2. 添加 2 个 Secret：`WAKEUP_NEW_ACCOUNT_API_KEY` / `WAKEUP_NEW_ACCOUNT_API_URL`（注意连接线 `-` 在 env 名里会变成 `_`）

3. 推送

## 设置触发时间

编辑 `.github/workflows/wakeup.yml`，找到 `schedule` 下的 `cron` 行：

```yaml
on:
  schedule:
    - cron: "0 0 * * *"
    - cron: "1 5 * * *"
    - cron: "2 10 * * *"
    - cron: "3 15 * * *"
```

**GitHub Actions 的 cron 只认 UTC 时间。** 你需要把你想要的本地时间换算成 UTC 填入。例如你想要北京时间 10:00，北京时间是 UTC+8，换算为 UTC 02:00，cron 写 `0 2 * * *`。

cron 格式为 5 个字段：`分 时 日 月 星期`（`*` 代表每）。

**夏令时提醒**：如果你的时区有夏令时（如欧洲、北美），每年 3 月和 10 月需调整 cron 值，或者接受实际触发时间偏移 1 小时。

## 支持的 Provider

| provider 值 | 说明 | API_URL |
|-------------|------|---------|
| `openai-compatible` | 任意 OpenAI 兼容接口，支持自定义中转站和代理 | 必填 |
| `openai-responses` | OpenAI 官方 Responses API | 可选（默认 `https://api.openai.com/v1`） |
| `anthropic` | Anthropic 官方 Messages API | 可选（默认 `https://api.anthropic.com`） |

## 安全

- `config/accounts.yaml` **不含** API key，可以安全提交
- API key 和 URL 通过 GitHub Secrets 注入，Actions 日志自动脱敏
- 仓库可设为公开，Fork 的人不会看到你的 Secrets

## License

MIT
