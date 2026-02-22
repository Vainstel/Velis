import React from "react"
import { useAtom, useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import { configAppliedModalAtom, newConfigVersionMessageAtom } from "../../atoms/appConfigState"
import PopupConfirm from "../PopupConfirm"

const ConfigAppliedModal: React.FC = () => {
  const { t } = useTranslation()
  const [show, setShow] = useAtom(configAppliedModalAtom)
  const versionMessage = useAtomValue(newConfigVersionMessageAtom)

  if (!show) {
    return null
  }

  const handleOk = async () => {
    if (window.ipcRenderer?.markConfigUpdateSeen) {
      await window.ipcRenderer.markConfigUpdateSeen()
    }
    setShow(false)
  }

  return (
    <PopupConfirm
      title={t("config.appliedTitle")}
      onConfirm={handleOk}
      confirmText={t("common.confirm")}
      footerType="center"
    >
      <div style={{ margin: "20px 0" }}>
        {versionMessage && (
          <p style={{ whiteSpace: "pre-line" }}>
            {versionMessage}
          </p>
        )}
      </div>
    </PopupConfirm>
  )
}

export default ConfigAppliedModal
