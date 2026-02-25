import React, {useState, useEffect} from "react"
import {useTranslation} from "react-i18next"
import {useSetAtom, useAtomValue} from "jotai"
import {showToastAtom} from "../../atoms/toastState"
import {writeRawConfigAtom} from "../../atoms/configState"
import {modelSettingsAtom} from "../../atoms/modelState"
import {loadAppConfigAtom, tokenPageDescriptionAtom, appConfigAtom} from "../../atoms/appConfigState"
import {defaultBaseModel, fieldsToLLMGroup, intoModelConfig, intoRawModelConfig} from "../../helper/model"
import {fetchModels} from "../../ipc/llm"
import Input from "../../components/Input"
import Button from "../../components/Button"
import "../../styles/components/_Setup.scss"

interface TokenSetupFormProps {
  onSuccess: () => void
  onBack: () => void
}

const TokenSetupForm: React.FC<TokenSetupFormProps> = ({
  onSuccess,
  onBack,
}) => {
  const { t } = useTranslation()
  const [token, setToken] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liteLLMUrl, setLiteLLMUrl] = useState("")

  // Load app config on mount
  const loadAppConfig = useSetAtom(loadAppConfigAtom)
  useEffect(() => {
    loadAppConfig()
  }, [loadAppConfig])

  useEffect(() => {
    const loadLiteLLMUrl = async () => {
      if (window.ipcRenderer?.getLiteLLMUrl) {
        const url = await window.ipcRenderer.getLiteLLMUrl()
        if (url) {
          setLiteLLMUrl(url)
        }
      }
    }
    loadLiteLLMUrl()
  }, [])

  const showToast = useSetAtom(showToastAtom)
  const saveConfig = useSetAtom(writeRawConfigAtom)
  const setSettings = useSetAtom(modelSettingsAtom)
  const appConfig = useAtomValue(appConfigAtom)

  const customTokenDescription = useAtomValue(tokenPageDescriptionAtom)

  const handleSubmit = async () => {
    if (!token.trim()) {
      showToast({ message: t("login.tokenRequired"), type: "error" })
      return
    }

    if (!liteLLMUrl) {
      showToast({ message: "LiteLLM URL not loaded from config", type: "error" })
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // LiteLLM is OpenAI-compatible, so we use openai_compatible provider
      const results = await fetchModels("openai_compatible", token, liteLLMUrl)

      if (results.error) {
        throw new Error(results.error)
      }

      if (!results.results || results.results.length === 0) {
        throw new Error("No models available")
      }

      // Create config using openai_compatible provider (LiteLLM is OpenAI-compatible)
      const group = fieldsToLLMGroup("openai_compatible", {
        apiKey: token,
        baseURL: liteLLMUrl,
        active: true
      })

      // Create model entries for ALL available models from provider
      // Config filtering will be applied via applyCurrentConfig() call below
      const models = results.results.map((modelId) => {
        const model = defaultBaseModel()
        model.model = modelId
        model.active = true // All models available for selection
        model.selectedByUser = false // From config, not user-selected
        return model
      })

      group.models = models

      // Save configuration - setSettings saves all models in the group
      const newSettings = {
        groups: [group],
        disableDiveSystemPrompt: false,
        enableTools: true,
        common: {
          configuration: {
            temperature: 0,
            topP: 0
          }
        }
      }

      setSettings(newSettings)

      // Create raw config only for the active model (first one) for MCP host
      const rawConfig = intoRawModelConfig(newSettings, group, models[0])

      if (rawConfig) {
        await saveConfig(rawConfig)
      }

      // Load and save default MCP config - only include MCPs that don't need credentials
      try {
        const templateServers = appConfig?.mcp?.mcpServers ?? {}
        const autoMcpServers: Record<string, any> = {}
        for (const [key, template] of Object.entries(templateServers)) {
          const hasFields = !!(template.velisSettings?.newVersionPip?.fields?.length)
          if (!hasFields) {
            autoMcpServers[key] = { ...template, enabled: true }
          }
        }
        if (Object.keys(autoMcpServers).length > 0) {
          await fetch("/api/config/mcpserver", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mcpServers: autoMcpServers }),
          })
        }
      } catch (mcpError) {
        // Don't fail the whole setup if MCP config fails
      }

      // Apply app config to filter models according to enabledModels
      // This centralizes config application logic in one place (backend)
      if (window.ipcRenderer?.applyCurrentConfig) {
        await window.ipcRenderer.applyCurrentConfig()
      }

      // Mark setup as completed
      if (window.ipcRenderer) {
        await window.ipcRenderer.markSetupCompleted()

        // Set mode to customer (using internal models)
        if (window.ipcRenderer.setSetupMode) {
          await window.ipcRenderer.setSetupMode("customer")
        }
      }

      // Show success and navigate
      showToast({ message: t("login.tokenSuccess"), type: "success" })

      // Navigate and reload to update isFirstLaunch state
      setTimeout(() => {
        onSuccess()
        // Reload window to update isFirstLaunch check
        window.location.reload()
      }, 500)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      showToast({
        message: errorMessage || t("login.tokenInvalid"),
        type: "error"
      })
      setError(errorMessage || t("login.tokenInvalid"))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="setup-container">
      <div className="setup-header">
        <h1>{t("login.tokenTitle")}</h1>
      </div>

      <div className="setup-form">
        <div className="form-group">
          <Input
            type="password"
            label={t("login.tokenLabel")}
            placeholder={t("login.tokenPlaceholder")}
            value={token}
            onChange={(e) => {
              setToken(e.target.value)
              setError(null)
            }}
            error={!!error}
            information={error || ""}
          />
        </div>

        <div className="form-actions" style={{ display: 'flex', flexDirection: 'row', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button
            theme="Outline"
            color="neutral"
            size="medium"
            onClick={onBack}
            disabled={isVerifying}
          >
            {t("login.backButton")}
          </Button>
          <Button
            theme="Color"
            color="primary"
            size="medium"
            onClick={handleSubmit}
            disabled={!token.trim() || isVerifying}
            loading={isVerifying}
          >
            {isVerifying ? t("login.tokenVerifying") : t("login.continueButton")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(TokenSetupForm)
