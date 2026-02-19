/// <reference types="vite/client" />

import type { ModelGroupSetting } from "../types/model"
import type { AppConfig, ConfigVersionInfo } from "../types/appConfig"

type ModelResults = {
  error?: string
  results: string[]
}

declare global {
  interface Window {
    // expose in the `electron/preload/index.ts`
    ipcRenderer: import("electron").IpcRenderer & {
      port: () => Promise<number>
      getResourcesPath: (p: string) => Promise<string>
      openScriptsDir: () => Promise<void>
      fillPathToConfig: (config: string) => Promise<string>
      openaiModelList: (apiKey: string) => Promise<ModelResults>
      openaiCompatibleModelList: (apiKey: string, baseURL: string) => Promise<ModelResults>
      anthropicModelList: (apiKey: string, baseURL: string) => Promise<ModelResults>
      ollamaModelList: (baseURL: string) => Promise<ModelResults>
      googleGenaiModelList: (apiKey: string) => Promise<ModelResults>
      mistralaiModelList: (apiKey: string) => Promise<ModelResults>
      bedrockModelList: (accessKeyId: string, secretAccessKey: string, sessionToken: string, region: string) => Promise<ModelResults>
      azureOpenaiModelList: (apiKey: string, azureEndpoint: string, azureDeployment: string, apiVersion: string) => Promise<ModelResults>
      showSelectionContextMenu: () => Promise<void>
      showInputContextMenu: () => Promise<void>
      getHotkeyMap: () => Promise<Record<string, any>>
      getPlatform: () => Promise<string>
      getAutoLaunch: () => Promise<boolean>
      setAutoLaunch: (enable: boolean) => Promise<void>
      getMinimalToTray: () => Promise<boolean>
      setMinimalToTray: (enable: boolean) => Promise<void>
      onReceivePort: (callback: (port: number) => void) => void
      download: (url: string) => Promise<void>
      copyImage: (url: string|Uint8Array) => Promise<void>
      isFirstLaunch: () => Promise<boolean>
      markSetupCompleted: () => Promise<void>
      resetToInitialSetup: () => Promise<{ success: boolean }>
      getModelSettings: () => Promise<ModelGroupSetting>
      setModelSettings: (settings: ModelGroupSetting) => Promise<void>
      listenRefresh: (cb: () => void) => () => void
      listenMcpApply: (cb: (id: string) => void) => () => void
      refreshConfig: () => Promise<void>
      onReceiveInstallHostDependenciesLog: (callback: (data: string) => void) => () => void
      getInstallHostDependenciesLog: () => Promise<string[]>
      getClientInfo: () => Promise<{ version: string, client_id: string }>
      checkCommandExist: (command: string) => Promise<boolean>
      readLocalFile: (filePath: string) => Promise<{ data: Buffer, name: string, mimeType: string }>
      getAppConfig: () => Promise<AppConfig | null>
      logUserAction: (action: string, payload?: string) => Promise<void>
      applyCurrentConfig: () => Promise<void>
      restartApp: () => void
      onAppConfigVersionUpdate: (callback: (data: ConfigVersionInfo) => void) => () => void
      getLiteLLMUrl: () => Promise<string | null>
      closeWindow: () => void
      hideWindow: () => void
    }

    PLATFORM: "darwin" | "win32" | "linux"
    isDev: boolean

    __TAURI_INTERNALS__: object
    __TAURI_METADATA__: {
      app: object
    }
  }
}
