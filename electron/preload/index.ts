import { ipcRenderer, contextBridge } from "electron"

import type { ModelGroupSetting } from "../../types/model"
import type { AppConfig, ConfigVersionInfo } from "../../types/appConfig"

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // listener
  onReceivePort: (callback: (port: number) => void) => {
    const listener = (_event: Electron.IpcMainInvokeEvent, value: number) => callback(value)
    ipcRenderer.on("app-port", listener as any)
    return () => ipcRenderer.off("app-port", listener as any)
  },
  onReceiveInstallHostDependenciesLog: (callback: (data: string) => void) => {
    const listener = (_event: Electron.IpcMainInvokeEvent, value: string) => callback(value)
    ipcRenderer.on("install-host-dependencies-log", listener as any)
    return () => ipcRenderer.off("install-host-dependencies-log", listener as any)
  },

  // util
  fillPathToConfig: (config: string) => ipcRenderer.invoke("util:fillPathToConfig", config),
  download: (url: string) => ipcRenderer.invoke("util:download", { url }),
  copyImage: (url: string) => ipcRenderer.invoke("util:copyimage", url),
  isFirstLaunch: () => ipcRenderer.invoke("util:isFirstLaunch"),
  markSetupCompleted: () => ipcRenderer.invoke("util:markSetupCompleted"),
  resetToInitialSetup: () => ipcRenderer.invoke("util:resetToInitialSetup"),
  getModelSettings: () => ipcRenderer.invoke("util:getModelSettings"),
  setModelSettings: (settings: ModelGroupSetting) => ipcRenderer.invoke("util:setModelSettings", settings),
  refreshConfig: () => ipcRenderer.invoke("util:refreshConfig"),
  getInstallHostDependenciesLog: () => ipcRenderer.invoke("util:getInstallHostDependenciesLog"),
  getClientInfo: () => ipcRenderer.invoke("util:getClientInfo"),
  checkCommandExist: (command: string) => ipcRenderer.invoke("util:checkCommandExist", command),
  readLocalFile: (filePath: string) => ipcRenderer.invoke("util:readLocalFile", filePath),

  // app config
  getAppConfig: (): Promise<AppConfig | null> => ipcRenderer.invoke("util:getAppConfig"),
  logUserAction: (action: string, payload?: string): Promise<void> => ipcRenderer.invoke("util:logUserAction", action, payload),
  applyCurrentConfig: (): Promise<void> => ipcRenderer.invoke("util:applyCurrentConfig"),
  restartApp: (): void => ipcRenderer.invoke("util:restartApp"),
  setSetupMode: (mode: "customer" | "custom"): Promise<void> => ipcRenderer.invoke("util:setSetupMode", mode),
  onAppConfigVersionUpdate: (callback: (data: ConfigVersionInfo) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, value: ConfigVersionInfo) => callback(value)
    ipcRenderer.on("app-config:version-update", listener as any)
    return () => ipcRenderer.off("app-config:version-update", listener as any)
  },

  // system
  openScriptsDir: () => ipcRenderer.invoke("system:openScriptsDir"),
  getAutoLaunch: () => ipcRenderer.invoke("system:getAutoLaunch"),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke("system:setAutoLaunch", enable),
  getMinimalToTray: () => ipcRenderer.invoke("system:getMinimalToTray"),
  setMinimalToTray: (enable: boolean) => ipcRenderer.invoke("system:setMinimalToTray", enable),
  closeWindow: () => ipcRenderer.invoke("system:closeWindow"),
  hideWindow: () => ipcRenderer.invoke("system:hideWindow"),

  // llm
  openaiModelList: (apiKey: string) => ipcRenderer.invoke("llm:openaiModelList", apiKey),
  openaiCompatibleModelList: (apiKey: string, baseURL: string) => ipcRenderer.invoke("llm:openaiCompatibleModelList", apiKey, baseURL),
  anthropicModelList: (apiKey: string, baseURL: string) => ipcRenderer.invoke("llm:anthropicModelList", apiKey, baseURL),
  ollamaModelList: (baseURL: string) => ipcRenderer.invoke("llm:ollamaModelList", baseURL),
  googleGenaiModelList: (apiKey: string) => ipcRenderer.invoke("llm:googleGenaiModelList", apiKey),
  mistralaiModelList: (apiKey: string) => ipcRenderer.invoke("llm:mistralaiModelList", apiKey),
  bedrockModelList: (accessKeyId: string, secretAccessKey: string, sessionToken: string, region: string) => ipcRenderer.invoke("llm:bedrockModelList", accessKeyId, secretAccessKey, sessionToken, region),
  azureOpenaiModelList: (apiKey: string, azureEndpoint: string, azureDeployment: string, apiVersion: string) => ipcRenderer.invoke("llm:azureOpenaiModelList", apiKey, azureEndpoint, azureDeployment, apiVersion),

  // context menu
  showSelectionContextMenu: () => ipcRenderer.invoke("show-selection-context-menu"),
  showInputContextMenu: () => ipcRenderer.invoke("show-input-context-menu"),

  // env
  getPlatform: () => ipcRenderer.invoke("env:getPlatform"),
  port: () => ipcRenderer.invoke("env:port"),
  getResourcesPath: (p: string) => ipcRenderer.invoke("env:getResourcesPath", p),
  isDev: () => ipcRenderer.invoke("env:isDev"),
  getLiteLLMUrl: () => ipcRenderer.invoke("env:getLiteLLMUrl"),

  // deep link
  listenMcpApply: (cb: (id: string) => void) => {
    const listener = (_event: Electron.IpcMainInvokeEvent, id: string) => cb(id)
    ipcRenderer.on("mcp.install", listener as any)
    return () => ipcRenderer.off("mcp.install", listener as any)
  },
})

// --------- Preload scripts loading ---------
import "../../shared/preload.js"
