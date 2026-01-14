import { app, ipcMain } from "electron"
import { createRequire } from "node:module"
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater"
import path from "node:path"
import { cwd } from "./constant"
import { CLIENT_ID } from "./client-id"

const { autoUpdater } = createRequire(import.meta.url)("electron-updater")

// Update server configuration - using GitHub releases only
const UPDATE_SERVER_CONFIG = {
  provider: "github",
  owner: "dive-app",
  repo: "dive"
}

// Auto update check configuration
const CHECK_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds
const INITIAL_DELAY = 3 * 1000 // 3 seconds delay for first check

export function update(win: Electron.BrowserWindow) {

  // When set to false, the update download will be triggered through the API
  autoUpdater.autoDownload = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false

  if (process.env.DEBUG) {
    autoUpdater.updateConfigPath = path.join(cwd, "dev-app-update.yml")
  }

  // Configure update server
  configureUpdateServer()

  // Setup automatic update checking
  if (app.isPackaged) {
    // First check after initial delay
    setTimeout(() => {
      performAutoUpdateCheck()
    }, INITIAL_DELAY)

    // Periodic checks every hour
    setInterval(() => {
      performAutoUpdateCheck()
    }, CHECK_INTERVAL)
  }

  async function performAutoUpdateCheck() {
    try {
      console.log("Performing automatic update check...")
      await autoUpdater.checkForUpdatesAndNotify()
    } catch (error) {
      console.error("Auto update check failed:", error)
      // Silent failure for automatic checks
    }
  }

  // start check
  autoUpdater.on("checking-for-update", function () { })
  // update available
  autoUpdater.on("update-available", (arg: UpdateInfo) => {
    win.webContents.send("update-can-available", { update: true, version: app.getVersion(), newVersion: arg?.version })
  })
  // update not available
  autoUpdater.on("update-not-available", (arg: UpdateInfo) => {
    win.webContents.send("update-can-available", { update: false, version: app.getVersion(), newVersion: arg?.version })
  })

  // Checking for updates
  ipcMain.handle("check-update", async () => {
    if (!app.isPackaged) {
      const error = new Error("The update feature is only available after the package.")
      return { message: error.message, error }
    }

    try {
      return await autoUpdater.checkForUpdatesAndNotify()
    } catch (error) {
      console.error("Update check failed:", error)
      return { message: "Network error", error }
    }
  })

  // Start downloading and feedback on progress
  ipcMain.handle("start-download", (event: Electron.IpcMainInvokeEvent) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          event.sender.send("update-error", { message: error.message, error })
        } else {
          // feedback update progress message
          event.sender.send("download-progress", progressInfo)
        }
      },
      () => {
        // feedback update downloaded message
        event.sender.send("update-downloaded")
      }
    )
  })

  // Install now
  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true)
  })
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  autoUpdater.on("download-progress", (info: ProgressInfo) => callback(null, info))
  autoUpdater.on("error", (error: Error) => callback(error, null))
  autoUpdater.on("update-downloaded", complete)
  autoUpdater.downloadUpdate()
}

// Configure update server (GitHub releases)
function configureUpdateServer() {
  console.log("Configuring update server: GitHub")
  autoUpdater.requestHeaders = {
    "User-Agent": `DiveDesktop/${app.getVersion()}`,
    "X-Dive-Id": CLIENT_ID,
  }
  autoUpdater.setFeedURL(UPDATE_SERVER_CONFIG)
}
