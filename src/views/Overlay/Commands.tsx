import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import {
  commandsAtom,
  loadCommandsAtom,
  addCommandAtom,
  updateCommandAtom,
  deleteCommandAtom,
  type Command
} from "../../atoms/commandState"
import { showToastAtom } from "../../atoms/toastState"
import Button from "../../components/Button"
import "../../styles/overlay/_Commands.scss"

type FormData = {
  name: string
  description: string
  template: string
}

type ValidationErrors = {
  name?: string
  template?: string
}

const Commands: React.FC = () => {
  const { t } = useTranslation()
  const commands = useAtomValue(commandsAtom)
  const loadCommands = useSetAtom(loadCommandsAtom)
  const addCommand = useSetAtom(addCommandAtom)
  const updateCommand = useSetAtom(updateCommandAtom)
  const deleteCommand = useSetAtom(deleteCommandAtom)
  const showToast = useSetAtom(showToastAtom)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    template: ""
  })
  const [errors, setErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    loadCommands()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = t("commands.validation.nameRequired")
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.name)) {
      newErrors.name = t("commands.validation.nameInvalid")
    } else {
      const isDuplicate = commands.some(
        cmd => cmd.name.toLowerCase() === formData.name.toLowerCase() && cmd.id !== editingId
      )
      if (isDuplicate) {
        newErrors.name = t("commands.validation.nameDuplicate")
      }
    }

    if (!formData.template.trim()) {
      newErrors.template = t("commands.validation.templateRequired")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOpenForm = (command?: Command) => {
    if (command) {
      setEditingId(command.id)
      setFormData({
        name: command.name,
        description: command.description || "",
        template: command.template
      })
    } else {
      setEditingId(null)
      setFormData({
        name: "",
        description: "",
        template: ""
      })
    }
    setErrors({})
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      template: ""
    })
    setErrors({})
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const commandData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        template: formData.template.trim()
      }

      if (editingId) {
        await updateCommand({ id: editingId, command: commandData })
      } else {
        await addCommand(commandData)
      }

      showToast({
        message: t("commands.toast.saved"),
        type: "success"
      })

      handleCloseForm()
    } catch (error) {
      console.error("Failed to save command:", error)
      showToast({
        message: t("commands.toast.saveFailed"),
        type: "error"
      })
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(t("commands.deleteConfirm"))
    if (!confirmed) return

    try {
      await deleteCommand(id)
      showToast({
        message: t("commands.toast.deleted"),
        type: "success"
      })
    } catch (error) {
      console.error("Failed to delete command:", error)
      showToast({
        message: t("commands.toast.deleteFailed"),
        type: "error"
      })
    }
  }

  return (
    <div className="commands-page">
      <div className="commands-container">
        <div className="commands-header">
          <div className="commands-title-container">
            <div className="commands-title">{t("commands.title")}</div>
            <div className="commands-description">{t("commands.description")}</div>
          </div>
          <Button
            theme="Color"
            color="primary"
            size="medium"
            onClick={() => handleOpenForm()}
          >
            {t("commands.addButton")}
          </Button>
        </div>

        <div className="commands-content">
          {commands.length === 0 ? (
            <div className="commands-empty">
              <div className="commands-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 8L3 12M3 12L7 16M3 12H15M17 8L21 12M21 12L17 16M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="commands-empty-title">{t("commands.noCommands")}</div>
              <div className="commands-empty-desc">{t("commands.noCommandsDesc")}</div>
            </div>
          ) : (
            <div className="commands-list">
              {commands.map((command) => (
                <div key={command.id} className="command-item">
                  <div className="command-item-main">
                    <div className="command-item-header">
                      <div className="command-item-name">/{command.name}</div>
                      {command.description && (
                        <div className="command-item-description">{command.description}</div>
                      )}
                    </div>
                    <div className="command-item-template">{command.template}</div>
                  </div>
                  <div className="command-item-actions">
                    <Button
                      theme="TextOnly"
                      color="primary"
                      size="small"
                      onClick={() => handleOpenForm(command)}
                    >
                      {t("commands.editButton")}
                    </Button>
                    <Button
                      theme="TextOnly"
                      color="danger"
                      size="small"
                      onClick={() => handleDelete(command.id)}
                    >
                      {t("commands.deleteButton")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="commands-form-overlay" onClick={handleCloseForm}>
          <div className="commands-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="commands-form-header">
              <div className="commands-form-title">
                {editingId ? `Edit Command` : t("commands.addButton")}
              </div>
              <button className="commands-form-close" onClick={handleCloseForm}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="commands-form-content">
              <div className="commands-form-field">
                <label className="commands-form-label">
                  {t("commands.form.name")}
                  <span className="commands-form-required">*</span>
                </label>
                <input
                  type="text"
                  className={`commands-form-input ${errors.name ? "error" : ""}`}
                  placeholder={t("commands.form.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <div className="commands-form-error">{errors.name}</div>}
              </div>

              <div className="commands-form-field">
                <label className="commands-form-label">
                  {t("commands.form.description")}
                </label>
                <input
                  type="text"
                  className="commands-form-input"
                  placeholder={t("commands.form.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="commands-form-field">
                <label className="commands-form-label">
                  {t("commands.form.template")}
                  <span className="commands-form-required">*</span>
                </label>
                <textarea
                  className={`commands-form-textarea ${errors.template ? "error" : ""}`}
                  placeholder={t("commands.form.templatePlaceholder")}
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  rows={8}
                />
                {errors.template && <div className="commands-form-error">{errors.template}</div>}
              </div>
            </div>

            <div className="commands-form-footer">
              <Button
                theme="Outline"
                color="neutralGray"
                size="medium"
                onClick={handleCloseForm}
              >
                {t("commands.cancelButton")}
              </Button>
              <Button
                theme="Color"
                color="primary"
                size="medium"
                onClick={handleSave}
              >
                {t("commands.saveButton")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Commands)
