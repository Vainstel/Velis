export interface AppConfig {
  version: string
  env: string
  os: "all" | "mac" | "windows" | "other"
  appText?: {
    customerMode?: {
      title?: string
      description?: string
    }
    tokenPage?: {
      description?: string
    }
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
