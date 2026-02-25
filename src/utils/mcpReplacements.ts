import type { McpFieldConfig, McpServerTemplate, VelisSettings } from "../../types/appConfig"

/**
 * Replace all ${CODE} placeholders in the entire template object
 * with the corresponding user-provided values.
 * Works recursively via JSON stringify/parse so replacements happen anywhere in the config.
 */
export function applyReplacements(
  template: McpServerTemplate,
  userValues: Record<string, string>
): McpServerTemplate {
  let jsonStr = JSON.stringify(template)
  for (const [code, value] of Object.entries(userValues)) {
    // Escape special regex characters in the code
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    jsonStr = jsonStr.replace(new RegExp(`\\$\\{${escaped}\\}`, "g"), value.replace(/\\/g, "\\\\").replace(/"/g, '\\"'))
  }
  return JSON.parse(jsonStr)
}

/**
 * Build the userValues map from fields array: { REPLACEMENT_CODE -> userValue }
 */
export function buildUserValuesMap(fields: McpFieldConfig[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.replacementCode] = field.userValue ?? field.defaultValue ?? ""
    return acc
  }, {})
}

/**
 * Pre-fill fields from an existing saved config's userValues.
 * Priority: saved userValue > defaultValue from template
 */
export function mergeFieldsWithSaved(
  templateFields: McpFieldConfig[],
  savedFields?: McpFieldConfig[]
): McpFieldConfig[] {
  if (!savedFields || savedFields.length === 0) return templateFields

  const savedMap = savedFields.reduce<Record<string, string>>((acc, f) => {
    if (f.userValue !== undefined) acc[f.replacementCode] = f.userValue
    return acc
  }, {})

  return templateFields.map((field) => ({
    ...field,
    userValue: savedMap[field.replacementCode] ?? field.defaultValue ?? "",
  }))
}

/**
 * Build the final MCP server config entry from a template + user field values.
 * - Applies replacements across the entire config
 * - Injects userValue into each field in velisSettings.newVersionPip.fields
 * - Sets enabled = true
 */
export function buildFinalMcpConfig(
  template: McpServerTemplate,
  fields: McpFieldConfig[]
): McpServerTemplate {
  const userValues = buildUserValuesMap(fields)
  const configured = applyReplacements(template, userValues)

  // Inject userValue into each field (for later pre-fill on re-configure)
  if (configured.velisSettings?.newVersionPip?.fields) {
    configured.velisSettings = {
      ...configured.velisSettings,
      newVersionPip: {
        ...configured.velisSettings.newVersionPip,
        fields: fields.map((f) => ({ ...f, userValue: f.userValue ?? f.defaultValue ?? "" })),
      },
    } as VelisSettings
  }

  configured.enabled = true
  return configured
}
