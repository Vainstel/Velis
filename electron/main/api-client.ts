import { app } from "electron"
import { CLIENT_ID } from "./client-id"
import { DEF_API_KEY, DEF_API_URL } from "./constant"
import type { AppConfig, ConfigVersionInfo } from "../../types/appConfig"

/**
 * Centralized API client for all backend requests
 */
class ApiClient {
  /**
   * Get common API parameters
   */
  private getApiParams() {
    const clientId = CLIENT_ID
    const os = process.env.VELIS_RUN_OS || this.getOSString(process.platform)
    const appVersion = app.getVersion()
    const apiKey = process.env.API_VELIS_BACK_KEY || DEF_API_KEY
    const apiUrl = process.env.VELIS_BACK_API_URL || DEF_API_URL

    return { clientId, os, appVersion, apiKey, apiUrl }
  }

  /**
   * Convert platform string to OS string
   */
  private getOSString(platform: string): string {
    if (platform === "darwin") return "mac"
    if (platform === "win32") return "windows"
    return "other"
  }

  /**
   * Fetch full runtime configuration from backend
   */
  async getRunConfig(): Promise<AppConfig | null> {
    try {
      const { clientId, os, appVersion, apiKey, apiUrl } = this.getApiParams()

      const url = `${apiUrl}/api/v1/run-config?clientId=${encodeURIComponent(clientId)}&os=${encodeURIComponent(os)}&appVersion=${encodeURIComponent(appVersion)}`

      console.log(`[ApiClient] Fetching run config from: ${apiUrl}`)
      console.log(`[ApiClient] clientId: ${clientId}, os: ${os}, appVersion: ${appVersion}`)

      const response = await fetch(url, {
        headers: {
          "X-API-Key": apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const config = await response.json()
      console.log(`[ApiClient] Fetched config version: ${config.version}`)
      return config as AppConfig
    } catch (error) {
      console.error("[ApiClient] Failed to fetch run config:", error)
      return null
    }
  }

  /**
   * Check config version from backend
   */
  async getConfigVersion(): Promise<ConfigVersionInfo> {
    try {
      const { clientId, os, appVersion, apiKey, apiUrl } = this.getApiParams()

      const url = `${apiUrl}/api/v1/run-config/version?clientId=${encodeURIComponent(clientId)}&os=${encodeURIComponent(os)}&appVersion=${encodeURIComponent(appVersion)}`

      const response = await fetch(url, {
        headers: {
          "X-API-Key": apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()
      return {
        hasUpdate: true, // Will be determined by caller
        newVersion: data.version,
        oldVersion: undefined, // Will be set by caller
      }
    } catch (error) {
      console.error("[ApiClient] Failed to check config version:", error)
      return { hasUpdate: false }
    }
  }

  /**
   * Log user action to monitoring API (fire-and-forget)
   */
  async logAction(action: string, payload?: string): Promise<void> {
    // Fire and forget - don't await, don't throw
    Promise.resolve().then(async () => {
      try {
        const { clientId, os, apiKey, apiUrl } = this.getApiParams()

        let url = `${apiUrl}/api/v1/monitoring/log-action?clientId=${encodeURIComponent(clientId)}&os=${encodeURIComponent(os)}&action=${encodeURIComponent(action)}`

        if (payload) {
          url += `&payload=${encodeURIComponent(payload)}`
        }

        await fetch(url, {
          headers: {
            "X-API-Key": apiKey,
          },
        })
      } catch (error) {
        // Silently ignore all errors
      }
    }).catch(() => {
      // Silently ignore all errors
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
