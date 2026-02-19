import React from "react"
import { useAtom } from "jotai"
import { useTranslation } from "react-i18next"
import { configVersionUpdateAtom } from "../../atoms/appConfigState"
import PopupConfirm from "../PopupConfirm"

const ConfigUpdateModal: React.FC = () => {
  const { t } = useTranslation()
  const [updateInfo, setUpdateInfo] = useAtom(configVersionUpdateAtom)

  if (!updateInfo?.hasUpdate) {
    return null
  }

  const handleRestart = () => {
    if (window.ipcRenderer?.restartApp) {
      window.ipcRenderer.restartApp()
      // App will restart, no need to clear state
    }
  }

  const handleSkip = () => {
    setUpdateInfo(null)
  }

  return (
    <PopupConfirm
      title={t("config.updateAvailable")}
      onConfirm={handleRestart}
      onCancel={handleSkip}
      confirmText={t("config.restart")}
      cancelText={t("config.skip")}
    >
      <div style={{ margin: "20px 0" }}>
        <p>
          <strong>{t("config.currentVersion")}:</strong> {updateInfo.oldVersion || "N/A"}
        </p>
        <p style={{ marginTop: "10px" }}>
          <strong>{t("config.newVersion")}:</strong> {updateInfo.newVersion || "N/A"}
        </p>
      </div>
    </PopupConfirm>
  )
}

export default ConfigUpdateModal
