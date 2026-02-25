export interface McpFieldConfig {
  name: string
  mandatory: boolean
  description?: string
  defaultValue?: string
  replacementCode: string
  userValue?: string
}

export interface VelisSettings {
  iconLink?: string
  saveMode?: boolean
  description?: string
  readableName?: string
  newVersionPip?: {
    fields: McpFieldConfig[]
    description?: string
  }
  saveModeTools?: string[]
}

export interface McpServerTemplate {
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  transport?: string
  velisSettings?: VelisSettings
  [key: string]: any
}

export interface AppConfig {
  version: string
  env: string
  os: "all" | "mac" | "windows" | "other"
  mcp?: {
    mcpServers?: Record<string, McpServerTemplate>
  }
  appText?: {
    customerMode?: {
      title?: string
      description?: string
    }
    tokenPage?: {
      description?: string
    }
    newConfigVersionMessage?: string
  }
  modelProviderConfig?: {
    url?: string
    enabledModels?: string[]
    version?: string
  }
}

export interface ConfigVersionInfo {
  hasUpdate: boolean
  newVersion?: string
  oldVersion?: string
}
