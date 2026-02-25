import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import PopupConfirm from "../../../../components/PopupConfirm"
import Input from "../../../../components/Input"
import Button from "../../../../components/Button"
import type { McpFieldConfig, McpServerTemplate } from "../../../../../types/appConfig"
import { buildFinalMcpConfig, mergeFieldsWithSaved } from "../../../../utils/mcpReplacements"
import "../../../../styles/overlay/_McpConfigure.scss"

interface McpConfigureDialogProps {
  mcpKey: string
  template: McpServerTemplate
  /** Existing saved config entry (from mcp_config.json) for this MCP, if any */
  existingEntry?: McpServerTemplate
  onSave: (mcpKey: string, finalEntry: McpServerTemplate) => Promise<void>
  onCancel: () => void
}

const McpConfigureDialog: React.FC<McpConfigureDialogProps> = ({
  mcpKey,
  template,
  existingEntry,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation()

  const velisSettings = template.velisSettings
  const readableName = velisSettings?.readableName ?? mcpKey
  const formDescription = velisSettings?.newVersionPip?.description
  const templateFields = velisSettings?.newVersionPip?.fields ?? []

  // Merge template fields with saved userValues for pre-fill
  const savedFields = existingEntry?.velisSettings?.newVersionPip?.fields
  const initialFields = mergeFieldsWithSaved(templateFields, savedFields)

  const [fields, setFields] = useState<McpFieldConfig[]>(
    initialFields.map((f) => ({
      ...f,
      userValue: f.userValue ?? f.defaultValue ?? "",
    }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const handleFieldChange = (index: number, value: string) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, userValue: value } : f)))
  }

  const hasErrors = fields.some(
    (f) => f.mandatory && (f.userValue === undefined || f.userValue.trim() === "")
  )

  const handleSave = async () => {
    setSubmitAttempted(true)
    if (hasErrors) return

    setIsSubmitting(true)
    try {
      const finalEntry = buildFinalMcpConfig(template, fields)
      await onSave(mcpKey, finalEntry)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PopupConfirm
      overlay
      className="mcp-configure-dialog"
      onConfirm={handleSave}
      onCancel={onCancel}
      disabled={isSubmitting}
      confirmText={
        isSubmitting ? (
          <div className="loading-spinner" />
        ) : (
          t("tools.configure.save")
        )
      }
      zIndex={1000}
      listenHotkey={false}
    >
      <div className="mcp-configure-header">
        <Button
          theme="TextOnly"
          color="success"
          size="small"
          shape="pill"
          svgFill="none"
          onClick={onCancel}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="22"
            height="22"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Button>
        <span className="mcp-configure-header-title">
          {t("tools.configure.title", { name: readableName })}
        </span>
      </div>

      <div className="mcp-configure-body">
        {formDescription && (
          <p className="mcp-configure-description">{formDescription}</p>
        )}

        {fields.length === 0 ? (
          <p className="mcp-configure-no-fields">{t("tools.configure.noFields")}</p>
        ) : (
          <div className="mcp-configure-fields">
            {fields.map((field, index) => {
              const isEmpty = field.userValue === undefined || field.userValue.trim() === ""
              const showError = submitAttempted && field.mandatory && isEmpty

              return (
                <div key={field.replacementCode} className="mcp-configure-field-item">
                  <div className="mcp-configure-field-label">
                    <span className="mcp-configure-field-name">
                      {field.name}
                      {field.mandatory && (
                        <span className="mcp-configure-field-required"> *</span>
                      )}
                    </span>
                    {field.description && (
                      <span className="mcp-configure-field-desc">{field.description}</span>
                    )}
                  </div>
                  <Input
                    size="small"
                    type="text"
                    placeholder={field.defaultValue ?? ""}
                    value={field.userValue ?? ""}
                    error={showError}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                  />
                  {showError && (
                    <span className="mcp-configure-field-error">
                      {t("tools.configure.mandatory")}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PopupConfirm>
  )
}

export default McpConfigureDialog
