import React, { useEffect } from "react"
import PopupWindow from "../../components/PopupWindow"
import "../../styles/overlay/_Setting.scss"
import Model from "./Model"
import Tools from "./Tools"
import System from "./System"
import Commands from "./Commands"
import { useSetAtom } from "jotai"
import { openOverlayAtom } from "../../atoms/layerState"
import { useTranslation } from "react-i18next"
import { version } from "../../../package.json"
import { settingTabAtom } from "../../atoms/globalState"

const tabs = ["Tools", "Model", "Commands", "System"] as const
export type Tab = (typeof tabs)[number]
export type Subtab = "Connector" | "Custom"

const Setting = ({ _tab, _subtab, _tabdata }: { _tab: Tab, _subtab?: Subtab, _tabdata?: any }) => {
  const { t } = useTranslation()
  const openOverlay = useSetAtom(openOverlayAtom)
  const setSettingTab = useSetAtom(settingTabAtom)

  useEffect(() => {
    setSettingTab(_tab)
  }, [_tab])

  return (
    <PopupWindow overlay>
      <div className="setting-container-wrapper">
        <div className="setting-container">
          <div className="setting-sidebar">
            <div className="setting-sidebar-items">
              <div className="setting-sidebar-category">
                <div className="setting-sidebar-category-left">
                  <span>{t("sidebar.manageAndSettings")}</span>
                </div>
              </div>
              {tabs.map((__tab) => (
                <div
                  key={__tab}
                  className="setting-sidebar-item-wrap"
                >
                  <div
                    className={`setting-sidebar-item ${__tab === _tab ? "active" : ""}`}
                    onClick={() => openOverlay({ page: "Setting", tab: __tab })}
                  >
                    {t(`setting.tabs.${__tab}`)}
                  </div>
                </div>
              ))}
              <div className="setting-sidebar-version">
                ver:v{version}
              </div>
            </div>
          </div>
          <div className="setting-content">
            {(() => {
              switch (_tab) {
                case "Model":
                  return <Model />
                case "Tools":
                  return <Tools _subtab={_subtab as Subtab} _tabdata={_tabdata} />
                case "Commands":
                  return <Commands />
                case "System":
                  return <System />
                default:
                  return null
              }
            })()}
          </div>
        </div>
      </div>
    </PopupWindow>
  )
}

export default React.memo(Setting)