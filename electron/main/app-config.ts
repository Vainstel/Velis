import { app, BrowserWindow } from "electron"
import fse from "fs-extra"
import path from "path"
import { configDir, DEF_CONFIG_CHECK_INTERVAL } from "./constant"
import type { AppConfig, ConfigVersionInfo } from "../../types/appConfig"
import type { ModelGroupSetting } from "../../types/model"
import type { InnerSettings } from "../../types/innerSettings"
import { apiClient } from "./api-client"

const CONFIG_FILE_NAME = "app_conf_run.json"

class AppConfigService {
  private config: AppConfig | null = null
  private checkInterval: NodeJS.Timeout | null = null
  private win: BrowserWindow | null = null

  /**
   * Initialize the config service - fetch and load config
   */
  async initialize(): Promise<void> {
    console.log("[AppConfig] Starting initialization...")

    // Check if cached config exists
    const configPath = path.join(configDir, CONFIG_FILE_NAME)
    const hasCachedConfig = await fse.pathExists(configPath)
    console.log(`[AppConfig] Cached config exists: ${hasCachedConfig} (path: ${configPath})`)

    try {
      await this.fetchAndUpdate()
      console.log("[AppConfig] Initialized successfully")
      console.log("[AppConfig] Current config version:", this.config?.version)

      // Apply config to app (update model_settings.json, etc.)
      if (this.config) {
        // Check mode before applying config
        const innerSettings = await this.loadInnerSettings()

        if (innerSettings?.mode === "custom") {
          console.log("[AppConfig] Custom mode detected - skipping config application")
          return
        }

        // Apply config only in customer mode or when mode not set
        await this.applyConfigToApp(this.config)
      }
    } catch (error) {
      console.error("[AppConfig] Initialization failed:", error)
      console.log(`[AppConfig] hasCachedConfig = ${hasCachedConfig}`)

      // Log error to monitoring API (fire-and-forget, non-blocking)
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logUserAction("GET_CONFIG_ERROR", errorMessage)

      if (!hasCachedConfig) {
        // First launch and failed to fetch - critical error
        const errorMsg = "Failed to fetch application configuration from server.\n\nPlease check your internet connection and try again later."
        console.error(`[AppConfig] CRITICAL: ${errorMsg}`)
        console.error(`[AppConfig] Application will exit now.`)

        // Show error dialog
        const { dialog, app: electronApp } = await import("electron")

        // Use synchronous dialog for blocking
        const result = dialog.showMessageBoxSync({
          type: "error",
          title: "Configuration Error",
          message: "Cannot start application",
          detail: errorMsg,
          buttons: ["Exit"],
          defaultId: 0
        })

        console.error(`[AppConfig] Dialog closed with result: ${result}`)
        console.error(`[AppConfig] Exiting application...`)

        // Force exit immediately
        process.exit(1)
      }

      // Try to load cached config
      console.log("[AppConfig] Using cached configuration...")
      await this.loadCachedConfig()

      if (!this.config) {
        const errorMsg = "No cached configuration found and failed to fetch from server.\n\nPlease check your internet connection and try again later."
        console.error(`[AppConfig] CRITICAL: ${errorMsg}`)
        console.error(`[AppConfig] Application will exit now.`)

        const { dialog } = await import("electron")
        dialog.showMessageBoxSync({
          type: "error",
          title: "Configuration Error",
          message: "Cannot start application",
          detail: errorMsg,
          buttons: ["Exit"],
          defaultId: 0
        })

        console.error(`[AppConfig] Exiting application...`)
        process.exit(1)
      }

      // Cached config loaded - no need to apply as it was already applied on previous launch
      console.log("[AppConfig] Using cached config without re-applying (already applied on previous launch)")
    }
  }

  /**
   * Get current config from memory
   */
  getConfig(): AppConfig | null {
    return this.config
  }

  /**
   * Fetch config and update if version changed
   */
  async fetchAndUpdate(): Promise<boolean> {
    const newConfig = await this.fetchConfig()
    if (!newConfig) {
      console.warn("[AppConfig] Failed to fetch config")
      throw new Error("Failed to fetch config from API or local file")
    }

    // Check if we should update
    const shouldUpdate = await this.shouldUpdateConfig(newConfig)

    if (shouldUpdate) {
      await this.saveConfig(newConfig)
      this.config = newConfig
      console.log(`[AppConfig] Updated to version ${newConfig.version}`)
      return true
    } else {
      // Load existing config if not updating
      if (!this.config) {
        await this.loadCachedConfig()
      }
      console.log(`[AppConfig] Config version ${newConfig.version} already up to date`)
      return false
    }
  }

  /**
   * Fetch config from API or local file based on ENV
   */
  private async fetchConfig(): Promise<AppConfig | null> {
    // Check for local file override first
    const localConfigPath = process.env.VELIS_APP_CONFIG_PATH_JSON
    if (localConfigPath) {
      try {
        console.log(`[AppConfig] Reading from local file: ${localConfigPath}`)
        const config = await fse.readJson(localConfigPath)
        console.log(`[AppConfig] Loaded config from file, version: ${config.version}`)
        return config as AppConfig
      } catch (error) {
        console.error("[AppConfig] Failed to read local config file:", error)
        // Fall through to API fetch
      }
    }

    // Fetch from API using centralized API client
    return await apiClient.getRunConfig()
  }

  /**
   * Check if config should be updated (version changed)
   */
  private async shouldUpdateConfig(newConfig: AppConfig): Promise<boolean> {
    const configPath = path.join(configDir, CONFIG_FILE_NAME)

    if (!await fse.pathExists(configPath)) {
      return true // First time, always save
    }

    try {
      const currentConfig = await fse.readJson(configPath)
      return currentConfig.version !== newConfig.version
    } catch (error) {
      console.error("[AppConfig] Failed to read current config:", error)
      return true // If we can't read it, treat as needing update
    }
  }

  /**
   * Save config to file
   */
  private async saveConfig(config: AppConfig): Promise<void> {
    const configPath = path.join(configDir, CONFIG_FILE_NAME)
    await fse.ensureDir(configDir)
    await fse.writeJson(configPath, config, { spaces: 2 })
    console.log(`[AppConfig] Saved config to ${configPath}`)
  }

  /**
   * Load cached config from file
   */
  private async loadCachedConfig(): Promise<void> {
    try {
      const configPath = path.join(configDir, CONFIG_FILE_NAME)
      if (await fse.pathExists(configPath)) {
        this.config = await fse.readJson(configPath)
        console.log(`[AppConfig] Loaded cached config version ${this.config?.version}`)
      }
    } catch (error) {
      console.error("[AppConfig] Failed to load cached config:", error)
    }
  }

  /**
   * Load inner settings (mode tracking)
   */
  private async loadInnerSettings(): Promise<InnerSettings | null> {
    try {
      const settingsPath = path.join(configDir, "inner_settings.json")
      if (await fse.pathExists(settingsPath)) {
        return await fse.readJson(settingsPath)
      }
    } catch (error) {
      console.error("[AppConfig] Failed to load inner settings:", error)
    }
    return null
  }

  /**
   * Save inner settings (mode tracking)
   */
  private async saveInnerSettings(settings: InnerSettings): Promise<void> {
    const settingsPath = path.join(configDir, "inner_settings.json")
    await fse.ensureDir(configDir)
    await fse.writeJson(settingsPath, settings, { spaces: 2 })
    console.log(`[AppConfig] Saved inner settings to ${settingsPath}`)
  }

  /**
   * Apply app config to system - update model_settings.json and other configs
   * This is the centralized place for applying config changes
   */
  async applyConfigToApp(config: AppConfig): Promise<void> {
    console.log("[AppConfig] Applying config to app...")

    try {
      // Update model_settings.json based on modelProviderConfig (models and URL)
      if (config.modelProviderConfig) {
        await this.updateModelSettings(config.modelProviderConfig)
      }

      // TODO: Future enhancements:
      // - Update other config files based on app config
      // - Apply UI customizations
      // - Update MCP server configs

      console.log("[AppConfig] Config successfully applied to app")
    } catch (error) {
      console.error("[AppConfig] Failed to apply config to app:", error)
      throw error
    }
  }

  /**
   * Update model_settings.json based on modelProviderConfig from app config
   * Updates both enabled models and baseURL
   */
  private async updateModelSettings(modelProviderConfig: NonNullable<AppConfig['modelProviderConfig']>): Promise<void> {
    const modelSettingsPath = path.join(configDir, "model_settings.json")

    try {
      let settings: ModelGroupSetting | null = null

      // Read existing settings if they exist
      if (await fse.pathExists(modelSettingsPath)) {
        settings = await fse.readJson(modelSettingsPath)
        console.log("[AppConfig] Loaded existing model_settings.json")
      }

      if (!settings) {
        console.log("[AppConfig] No existing model_settings.json - will be created on first model save")
        return
      }

      const enabledModels = new Set(modelProviderConfig.enabledModels || [])
      const baseURL = modelProviderConfig.url

      // Update models and baseURL in each group
      for (const group of settings.groups) {
        // Update baseURL if provided in config
        if (baseURL) {
          group.baseURL = baseURL
          console.log(`[AppConfig] Updated ${group.modelProvider} baseURL to: ${baseURL}`)
        }

        // Update active flag based on enabledModels from backend config.
        // Don't touch models with selectedByUser: true - user explicitly chose them.
        // All other models: active = true only if they are in enabledModels from backend.
        let updatedCount = 0
        for (const model of group.models) {
          if (model.selectedByUser === true) {
            continue // User-selected models are not modified
          }
          const shouldBeActive = enabledModels.has(model.model)
          if (model.active !== shouldBeActive) {
            model.active = shouldBeActive
            updatedCount++
          }
        }

        console.log(`[AppConfig] Updated ${updatedCount} models' active status in ${group.modelProvider} group`)
      }

      // Save updated settings
      await fse.writeJson(modelSettingsPath, settings, { spaces: 2 })
      console.log("[AppConfig] Updated model_settings.json with active flags from backend config")
    } catch (error) {
      console.error("[AppConfig] Failed to update model_settings.json:", error)
      // Non-critical error - don't throw
    }
  }

  /**
   * Check for new version from API
   */
  async checkVersion(): Promise<ConfigVersionInfo> {
    try {
      const versionInfo = await apiClient.getConfigVersion()
      const oldVersion = this.config?.version

      return {
        hasUpdate: oldVersion !== versionInfo.newVersion,
        newVersion: versionInfo.newVersion,
        oldVersion,
      }
    } catch (error) {
      console.error("[AppConfig] Version check failed:", error)
      return { hasUpdate: false }
    }
  }

  /**
   * Log user action to monitoring API (fire-and-forget)
   */
  async logUserAction(action: string, payload?: string): Promise<void> {
    await apiClient.logAction(action, payload)
  }

  /**
   * Start periodic version checking
   */
  startPeriodicCheck(window: BrowserWindow): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.win = window
    const intervalMs = parseInt(process.env.VELIS_CONFIG_CHECK_INTERVAL_MS || String(DEF_CONFIG_CHECK_INTERVAL))

    console.log(`[AppConfig] Starting periodic check every ${intervalMs}ms`)

    this.checkInterval = setInterval(async () => {
      try {
        const result = await this.checkVersion()

        // Log version check
        const payload = JSON.stringify({
          appVersion: app.getVersion(),
          currentConfigVersion: result.oldVersion,
          newConfigVersion: result.newVersion,
          hasUpdate: result.hasUpdate
        })
        await this.logUserAction("CHECK_CONFIG_VERSION", payload)

        if (result.hasUpdate) {
          // Check mode before notifying user
          const innerSettings = await this.loadInnerSettings()

          if (innerSettings?.mode === "custom") {
            console.log("[AppConfig] Custom mode - skipping update notification")
            return
          }

          // Notify only in customer mode
          if (this.win && !this.win.isDestroyed()) {
            console.log(`[AppConfig] New version available: ${result.oldVersion} -> ${result.newVersion}`)
            this.win.webContents.send("app-config:version-update", result)
          }
        }
      } catch (error) {
        console.error("[AppConfig] Periodic check error:", error)
      }
    }, intervalMs)
  }

  /**
   * Apply current config to app
   * Can be called from IPC after model_settings.json is created
   */
  async applyCurrentConfig(): Promise<void> {
    if (!this.config) {
      const errorMsg = "Cannot apply config - no config loaded. Application will exit."
      console.error("[AppConfig] CRITICAL:", errorMsg)

      const { dialog } = await import("electron")
      dialog.showMessageBoxSync({
        type: "error",
        title: "Configuration Error",
        message: "Cannot apply configuration",
        detail: errorMsg,
        buttons: ["Exit"],
        defaultId: 0
      })

      process.exit(1)
    }

    await this.applyConfigToApp(this.config)
  }

  /**
   * Set setup mode (customer or custom)
   * Called after initial setup to track which setup path was chosen
   */
  async setMode(mode: "customer" | "custom"): Promise<void> {
    await this.saveInnerSettings({ mode })
    console.log(`[AppConfig] Mode set to: ${mode}`)
  }

  /**
   * Restart application
   * Called when user clicks restart button after config update notification
   * On restart, initialize() will download and apply new config automatically
   */
  restartApp(): void {
    console.log("[AppConfig] Restarting application...")
    app.relaunch()
    app.exit(0)
  }

}

// Export singleton instance
export const appConfigService = new AppConfigService()
