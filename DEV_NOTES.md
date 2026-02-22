# Developer Notes

## Version Management

Update version in 3 files simultaneously:
1. `package.json` → `"version": "1.11.2"`
2. `src-tauri/Cargo.toml` → `version = "1.11.2"`
3. `src-tauri/tauri.conf.json` → `"version": "1.11.2"`

UI auto-imports from `package.json`. Electron uses `app.getVersion()`.

## App Configuration System

### Overview
Fetches runtime config from backend API or local file at startup. Enables environment-specific deployments and customization without code changes.

**Config includes:** UI text overrides, enabled models list, LiteLLM URL and father even more..

**Storage:**
- Development: `.config/app_conf_run.json`
- Production: `~/.velis/config/app_conf_run.json`

### Version Management
- Config has `version` field (e.g., "0.1", "1.0")
- Checked periodically (default: 5 minutes, configurable via `VELIS_CONFIG_CHECK_INTERVAL_MS`)
- Only updates when version changes

### Startup Flow
1. `appConfigService.initialize()` fetches config from API or local file
2. Compares version with existing `app_conf_run.json`
3. Updates if version differs, uses cached if same
4. **Applies config:** `applyConfigToApp()` updates `model_settings.json` (models + baseURL)
5. Starts periodic version checks

### Update Flow
When new version detected:
1. Modal shown to user with "Restart" or "Skip" options
2. User clicks "Restart" → `restartApp()` called
3. On next startup, `initialize()` downloads and applies new config automatically

### Config Application
**Centralized method:** `applyConfigToApp(config)` in `electron/main/app-config.ts`
- Updates `model_settings.json` based on `modelProviderConfig.enabledModels`
- Updates `baseURL` from `modelProviderConfig.url`
- Does NOT replace the models array — only updates the `active` flag
- Models with `selectedByUser: true` are never modified
- Models in `enabledModels` from backend → `active: true`
- Models NOT in `enabledModels` → `active: false`

### Model Selection Tracking
`model_settings.json` contains ALL models available from the provider.
The `active` flag controls whether a model appears in the chat model selector.

- `selectedByUser: true` - User manually toggled this model in Settings → preserved across config updates
- `selectedByUser: false` - Model state managed by backend config (default for all models)

**How `selectedByUser` is set:**
- When user checks a model checkbox in Settings → `selectedByUser: true`
- When user unchecks a model checkbox in Settings → `selectedByUser: false`
- On model list reload from API → `selectedByUser` is preserved from existing model state
- On first setup (TokenSetupForm) → all models get `selectedByUser: false`

**Why this matters:** Backend config can enable/disable models (`active` flag), but never overrides user's explicit choices (`selectedByUser: true`).

### Setup Modes

Two modes control config application behavior:

**Customer Mode** (`mode: "customer"`):
- User chose "Use Internal Models" and entered token
- Backend config is applied on startup (models, LiteLLM URL)
- Update notifications shown when new config version available
- File: `inner_settings.json` with `{"mode": "customer"}`

**Custom Mode** (`mode: "custom"`):
- User chose "Use Your Own Prepared Models" and configured provider manually
- Backend config is NOT applied on startup
- Update notifications are NOT shown
- File: `inner_settings.json` with `{"mode": "custom"}`

**Mode is set**:
- TokenSetupForm → `setSetupMode("customer")`
- ModelConfigForm → `setSetupMode("custom")`

**Mode is checked**:
- `appConfigService.initialize()` - Skips `applyConfigToApp()` if custom mode
- `appConfigService.startPeriodicCheck()` - Skips update notification if custom mode

### "What's New" Modal (`ConfigAppliedModal`)

Shown on startup after a new config version was downloaded and applied.

**Trigger flag:** `configUpdateSeen` in `inner_settings.json`
- `false` — new config was applied, user hasn't seen the message yet
- `true` (or absent) — nothing to show

**Flow:**
1. `initialize()` calls `fetchAndUpdate()` — returns `true` if config was updated
2. If updated + mode is `"customer"` → saves `configUpdateSeen: false` to `inner_settings.json`
3. On next startup, `Layout.tsx` reads `getInnerSettings()`
4. If `mode === "customer"` and `configUpdateSeen === false`:
   - Loads app config (to populate `newConfigVersionMessageAtom`)
   - Shows `ConfigAppliedModal` with message from `appText.newConfigVersionMessage`
5. User clicks OK → `markConfigUpdateSeen()` sets `configUpdateSeen: true`

**Key files:**
- `src/components/Modal/ConfigAppliedModal.tsx` — modal component
- `src/atoms/appConfigState.ts` — `configAppliedModalAtom`, `newConfigVersionMessageAtom`
- `src/views/Layout.tsx` — startup check logic
- IPC: `util:getInnerSettings`, `util:markConfigUpdateSeen`

### Token Counting

Token usage is extracted from `ai_message.usage_metadata` after each LLM response.

**OpenAI-compatible providers (LiteLLM):**
Usage metadata is NOT included in streaming responses by default. Must explicitly enable via:
```python
# mcp-host/dive_mcp_host/models/__init__.py
cleaned_kwargs["stream_options"] = {"include_usage": True}
```
Without this, `usage_metadata` is `None` and all token counts show as 0.

**Fields sent to frontend (`token_usage` event):**
- `inputTokens` — total input tokens for the request (includes system prompt + tools + history)
- `outputTokens` — tokens in the AI response
- `userToken` — tokens in the user's message only (approximate)
- `timeToFirstToken` — seconds to first response chunk
- `tokensPerSecond` — output generation speed
- `modelName` — model name from response metadata

**Note:** `inputTokens` in AI response includes system prompt + all MCP tool definitions + conversation history, so it will be much larger than just the user's message. The user message token count is shown separately via `userToken`.

### User Action Monitoring
Fire-and-forget async calls to backend for analytics:
- `NEW_USER_MESSAGE` - User sends chat message
- `GET_CONFIG_ERROR` - Config fetch fails (includes error details)

### Environment Variables
See `ENV_DOC.md` for details:
- `VELIS_BACK_API_URL` - Backend API URL
- `API_VELIS_BACK_KEY` - API authentication key
- `VELIS_APP_CONFIG_PATH_JSON` - Local config file path (bypasses API)
- `VELIS_RUN_OS` - Override OS detection
- `VELIS_CONFIG_CHECK_INTERVAL_MS` - Check interval (default: 300000ms = 5 min)

### Architecture

**API Client** (`electron/main/api-client.ts`):
- Centralized backend API requests
- Methods: `getRunConfig()`, `getConfigVersion()`, `logAction()`

**Config Service** (`electron/main/app-config.ts`):
- `initialize()` - Load config on startup, sets `configUpdateSeen: false` if updated in customer mode
- `fetchAndUpdate()` - Fetch and update if version changed, returns `true` if config was updated
- `applyConfigToApp(config)` - Apply config to system
- `applyCurrentConfig()` - Apply current config (called after token setup)
- `restartApp()` - Restart application
- `startPeriodicCheck()` - Check for updates periodically
- `setMode(mode)` - Save customer/custom mode to `inner_settings.json`
- `getInnerSettings()` - Read `inner_settings.json`
- `markConfigUpdateSeen()` - Set `configUpdateSeen: true` in `inner_settings.json`

**Frontend State** (`src/atoms/appConfigState.ts`):
- Jotai atoms for config access
- Derived atoms for text customization and enabled models

### Key Files
- `electron/main/api-client.ts` - API client
- `electron/main/app-config.ts` - Config service
- `src/atoms/appConfigState.ts` - Frontend state
- `types/appConfig.ts` - Type definitions
- `types/innerSettings.ts` - Inner settings type (`mode`, `configUpdateSeen`)
- `electron/main/constant.ts` - Default values
- `src/components/Modal/ConfigAppliedModal.tsx` - "What's New" modal
- `src/components/Modal/ConfigUpdateModal.tsx` - Version update modal (restart prompt)