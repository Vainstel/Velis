import { app, ipcMain, BrowserWindow } from "electron"
import { serviceStatus } from "../service"
import path from "node:path"
import { VITE_DEV_SERVER_URL } from "../constant"
import { appConfigService } from "../app-config"

export function ipcEnvHandler(_win: BrowserWindow) {
  ipcMain.handle("env:getPlatform", async () => {
    return process.platform
  })

  ipcMain.handle("env:port", async () => {
    return serviceStatus.port
  })

  ipcMain.handle("env:getResourcesPath", async (_, p: string) => {
    return app.isPackaged ? path.join(process.resourcesPath, p) : p
  })

  ipcMain.handle("env:isDev", async () => {
    return !!VITE_DEV_SERVER_URL
  })

  ipcMain.handle("env:getLiteLLMUrl", async () => {
    const config = appConfigService.getConfig()
    return config?.modelProviderConfig?.url || null
  })
}

