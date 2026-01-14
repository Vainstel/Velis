import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSetAtom, useAtomValue } from "jotai"
import { codeStreamingAtom } from "../atoms/codeStreaming"
import { useTranslation } from "react-i18next"
import { historiesAtom, loadHistoriesAtom } from "../atoms/historyState"
import ChatInput from "../components/ChatInput"
import Login from "./Login"
import "../styles/pages/_Welcome.scss"

const Welcome = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const updateStreamingCode = useSetAtom(codeStreamingAtom)
  const histories = useAtomValue(historiesAtom)
  const loadHistories = useSetAtom(loadHistoriesAtom)
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)

  useEffect(() => {
    document.title = t("header.title")
  }, [])

  useEffect(() => {
    updateStreamingCode(null)
  }, [updateStreamingCode])

  useEffect(() => {
    loadHistories()
  }, [loadHistories])

  const checkFirstLaunch = () => {
    if (window.ipcRenderer) {
      window.ipcRenderer.isFirstLaunch().then(setIsFirstLaunch)
    }
  }

  useEffect(() => {
    // Check if this is first launch by checking if .setup_completed exists
    checkFirstLaunch()
  }, [])

  useEffect(() => {
    // Re-check when navigating back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkFirstLaunch()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const recentHistories = useMemo(() => {
    const sortedHistories = [...histories.normal, ...histories.starred].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return sortedHistories.slice(0, 3)
  }, [histories])

  // Show login screen if model_config.json doesn't exist (first launch)
  if (isFirstLaunch === null) {
    // Still checking, show nothing
    return null
  }

  if (isFirstLaunch) {
    return <Login />
  }

  return (
    <div className="main-container">
      <div className="welcome-content">
        <h1>{t("welcome.title")}</h1>
        <p className="subtitle">{t("welcome.subtitle")}</p>

        <ChatInput
          page="welcome"
          onSendMessage={() => {}}
          disabled={false}
          onAbort={() => {}}
        />

        <div className="suggestions">
          {recentHistories.length > 0 && recentHistories.map(history => (
            <div
              key={history.id}
              className="suggestion-item"
              onClick={() => navigate(`/chat/${history.id}`)}
            >
              <div className="content-wrapper">
                <strong>{history.title || t("chat.untitledChat")}</strong>
              </div>
              <div className="bottom-row">
                <p>{new Date(history.createdAt).toLocaleString()}</p>
                <span className="arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Welcome)
