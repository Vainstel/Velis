import {atom} from "jotai"

export interface MCP {
  type: "custom"
  plan?: string
  description: string
  icon?: string
  disabled?: boolean
  enabled?: boolean
  error?: string
  env?: Record<string, unknown>
  exclude_tools?: string[]
  command?: string
}

export interface MCPConfig {
  [key: string]: MCP
}

export interface SubTool {
  name: string
  description?: string
  enabled: boolean
}

export interface Tool {
  name: string
  type?: "custom" | "connector"
  description?: string
  url?: string
  icon?: string
  tools?: SubTool[]
  error?: string
  enabled: boolean
  disabled?: boolean
  status?: "failed" | "running" | "unauthorized"
  has_credential?: boolean
  command?: string
  commandExists?: boolean
}

export const toolsAtom = atom<Tool[]>([])

export const enabledToolsAtom = atom<Tool[]>(
  (get) => {
    const tools = get(toolsAtom)
    return tools.filter((tool) => tool.enabled)
  }
)

export const successToolsAtom = atom<Tool[]>(
  (get) => {
    const tools = get(toolsAtom)
    return tools.filter((tool) => tool.enabled && !tool.error)
  }
)

export const failedToolsAtom = atom<Tool[]>(
  (get) => {
    const tools = get(toolsAtom)
    return tools.filter((tool) => tool.enabled && (!!tool.error || tool.disabled || tool.status === "failed"))
  }
)

export const loadToolsAtom = atom(
  null,
  async (get, set) => {
    const response = await fetch("/api/tools")
    const data = await response.json()
    const mcpserverResponse = await fetch("/api/config/mcpserver")
    const mcpserverData = await mcpserverResponse.json()
    if (data.success) {
      let tools = data.tools
      if (mcpserverData.success) {
        tools = tools.filter((tool: Tool) => {
          const mcpserver = Object.keys(mcpserverData.config.mcpServers).find((mcpServer: string) => mcpServer === tool.name)
          return mcpserver ? tool : null
        })
      }
      set(toolsAtom, tools)
    }

    return data
  }
)

export const mcpConfigAtom = atom<{mcpServers: MCPConfig}>({mcpServers: {}})

export const loadMcpConfigAtom = atom(
  null,
  async (get, set) => {
    const response = await fetch("/api/config/mcpserver")
    const data = await response.json()
    if (data.success) {
      set(mcpConfigAtom, data.config)
    } else {
      set(mcpConfigAtom, {mcpServers: {}})
    }

    return data
  }
)

export const installToolBufferAtom = atom<{name: string, config: Record<string, MCP>}[]>([])

export const loadingToolsAtom = atom<Record<string, { enabled: boolean }>>({})

export const saveModeAtom = atom<boolean>(false)

export const saveModeBackupAtom = atom<Record<string, string[]>>({})

export const toggleSaveModeAtom = atom(
  null,
  async (get, set) => {
    const isSaveMode = get(saveModeAtom)
    const mcpConfig = get(mcpConfigAtom)
    const tools = get(toolsAtom)

    if (!isSaveMode) {
      // ─── Turning ON ───
      const backup: Record<string, string[]> = {}
      const newMcpServers = { ...mcpConfig.mcpServers }

      for (const [key, server] of Object.entries(mcpConfig.mcpServers)) {
        if (!(server as any).velisSettings) continue

        backup[key] = server.exclude_tools ?? []

        const saveModeTools: string[] = (server as any).velisSettings?.saveModeTools ?? []
        const allToolNames = tools.find(t => t.name === key)?.tools?.map(t => t.name) ?? []

        newMcpServers[key] = {
          ...server,
          exclude_tools: saveModeTools.length > 0
            ? allToolNames.filter(name => !saveModeTools.includes(name))
            : allToolNames,
        }
      }

      set(saveModeBackupAtom, backup)
      set(saveModeAtom, true)
      set(mcpConfigAtom, { mcpServers: newMcpServers })

      await fetch("/api/config/mcpserver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcpServers: newMcpServers }),
      })
      await set(loadToolsAtom)

    } else {
      // ─── Turning OFF ───
      const backup = get(saveModeBackupAtom)
      const newMcpServers = { ...mcpConfig.mcpServers }

      for (const [key, originalExclude] of Object.entries(backup)) {
        if (newMcpServers[key]) {
          newMcpServers[key] = { ...newMcpServers[key], exclude_tools: originalExclude }
        }
      }

      set(saveModeAtom, false)
      set(saveModeBackupAtom, {})
      set(mcpConfigAtom, { mcpServers: newMcpServers })

      await fetch("/api/config/mcpserver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcpServers: newMcpServers }),
      })
      await set(loadToolsAtom)
    }
  }
)
