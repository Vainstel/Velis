import { atom } from "jotai"
import type { AppConfig, ConfigVersionInfo } from "../../types/appConfig"

// Main app config atom
export const appConfigAtom = atom<AppConfig | null>(null)

// Load app config from backend
export const loadAppConfigAtom = atom(
  null,
  async (get, set) => {
    try {
      if (window.ipcRenderer?.getAppConfig) {
        const config = await window.ipcRenderer.getAppConfig()
        set(appConfigAtom, config)
        return config
      }
      return null
    } catch (error) {
      console.warn("Failed to load app config:", error)
      return null
    }
  }
)

// Derived atoms for text customization
export const customerModeTitleAtom = atom<string | null>(
  (get) => {
    const config = get(appConfigAtom)
    return config?.appText?.customerMode?.title || null
  }
)

export const customerModeDescriptionAtom = atom<string | null>(
  (get) => {
    const config = get(appConfigAtom)
    return config?.appText?.customerMode?.description || null
  }
)

export const tokenPageDescriptionAtom = atom<string | null>(
  (get) => {
    const config = get(appConfigAtom)
    return config?.appText?.tokenPage?.description || null
  }
)

// Derived atom for enabled models
export const enabledModelsAtom = atom<string[] | null>(
  (get) => {
    const config = get(appConfigAtom)
    return config?.modelProviderConfig?.enabledModels || null
  }
)

// Config version update info (used by update modal)
export const configVersionUpdateAtom = atom<ConfigVersionInfo | null>(null)
