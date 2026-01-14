import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import "@/styles/pages/_Login.scss"
import { useNavigate } from "react-router-dom"
import Button from "../components/Button"
import TokenSetupForm from "./Setup/TokenSetupForm"

const Login = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showTokenForm, setShowTokenForm] = useState(false)

  return (
    <div className="login-page-container">
      <div className="header">
        <h1 className="main-title">Start Your Dive AI</h1>
        <p className="subtitle">
          {t("login.subtitle")}
        </p>
      </div>

      {!showTokenForm ? (
        <div className="options-container">
          {/* Left Card - Use Your Own Models */}
          <div className="option-card">
            <h2 className="option-title">{t("login.title1")}</h2>
            <p className="option-description">
              {t("login.description1")}
            </p>
            <div className="button-container">
              <Button
                theme="Color"
                color="primary"
                size="large"
                onClick={() => {
                  navigate("/setup")
                }}
              >{t("login.button1")}</Button>
            </div>
          </div>

          <div className="option-gap"></div>

          {/* Right Card - Use Internal Models */}
          <div className="option-card">
            <h2 className="option-title">{t("login.title2")}</h2>
            <p className="option-description">
              {t("login.description2")}
            </p>
            <div className="button-container">
              <Button
                theme="Color"
                color="primary"
                size="large"
                onClick={() => setShowTokenForm(true)}
              >{t("login.button2")}</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="token-form-container">
          <TokenSetupForm
            onSuccess={() => navigate("/")}
            onBack={() => setShowTokenForm(false)}
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(Login)
