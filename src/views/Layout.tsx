import React, { useState, useEffect } from "react"
import {Outlet} from "react-router-dom"
import HistorySidebar from "../components/HistorySidebar"
import Header from "../components/Header"
import {useAtom, useAtomValue, useSetAtom} from "jotai"
import {isConfigNotInitializedAtom} from "../atoms/configState"
import GlobalToast from "../components/GlobalToast"
import {systemThemeAtom, themeAtom} from "../atoms/themeState"
import Overlay from "./Overlay"
import KeymapModal from "../components/Modal/KeymapModal"
import RenameConfirmModal from "../components/Modal/RenameConfirmModal"
import CodeModal from "./Chat/CodeModal"
import {overlaysAtom} from "../atoms/layerState"
import {loadCommandsAtom} from "../atoms/commandState"

const Layout = () => {
  const isConfigNotInitialized = useAtomValue(isConfigNotInitializedAtom)
  const [theme] = useAtom(themeAtom)
  const [systemTheme] = useAtom(systemThemeAtom)
  const overlays = useAtomValue(overlaysAtom)
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false)
  const loadCommands = useSetAtom(loadCommandsAtom)

  const checkFirstLaunch = () => {
    if (window.ipcRenderer) {
      window.ipcRenderer.isFirstLaunch().then(setIsFirstLaunch)
    }
  }

  useEffect(() => {
    // Check if this is first launch
    checkFirstLaunch()

    // Load commands on mount
    loadCommands()

    // Re-check when window becomes visible or focus changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkFirstLaunch()
      }
    }

    const handleFocus = () => {
      checkFirstLaunch()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Also check periodically in case setup completes
    const interval = setInterval(checkFirstLaunch, 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [loadCommands])

  return (
    <div className="app-container" data-theme={theme === "system" ? systemTheme : theme}>
      <div className="app-content">
        {!isFirstLaunch && !isConfigNotInitialized && <HistorySidebar />}
        <div className="outlet-container">
          {!isFirstLaunch && !isConfigNotInitialized && <Header showHelpButton={overlays.length === 0} showModelSelect={overlays.length === 0} />}
          <Outlet />
        </div>
        <CodeModal />
      </div>
      <Overlay />
      <GlobalToast />
      <KeymapModal />
      <RenameConfirmModal />
    </div>
  )
}

export default React.memo(Layout)
