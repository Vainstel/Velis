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
- Preserves user-selected models (`selectedByUser: true`)
- Replaces config-enabled models (`selectedByUser: false`) and add new ones

### Model Selection Tracking
- `selectedByUser: true` - User manually enabled (preserved across updates)
- `selectedByUser: false` - Config-enabled (replaced when config changes)

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
- `initialize()` - Load config on startup
- `fetchAndUpdate()` - Fetch and update if version changed
- `applyConfigToApp(config)` - Apply config to system
- `applyCurrentConfig()` - Apply current config (called after token setup)
- `restartApp()` - Restart application
- `startPeriodicCheck()` - Check for updates periodically

**Frontend State** (`src/atoms/appConfigState.ts`):
- Jotai atoms for config access
- Derived atoms for text customization and enabled models

### Key Files
- `electron/main/api-client.ts` - API client
- `electron/main/app-config.ts` - Config service
- `src/atoms/appConfigState.ts` - Frontend state
- `types/appConfig.ts` - Type definitions
- `electron/main/constant.ts` - Default values