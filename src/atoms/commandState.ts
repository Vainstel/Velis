import { atom } from "jotai"
import { invokeIPC } from "../ipc"

export type Command = {
  id: string
  name: string
  description?: string
  template: string
}

export const commandsAtom = atom<Command[]>([])

export const loadCommandsAtom = atom(
  null,
  async (get, set) => {
    try {
      const commands = await invokeIPC("util:getCommands")
      set(commandsAtom, commands || [])
    } catch (error) {
      console.error("Failed to load commands:", error)
      set(commandsAtom, [])
    }
  }
)

export const saveCommandsAtom = atom(
  null,
  async (get, set, commands: Command[]) => {
    try {
      await invokeIPC("util:saveCommands", commands)
      set(commandsAtom, commands)
    } catch (error) {
      console.error("Failed to save commands:", error)
      throw error
    }
  }
)

export const addCommandAtom = atom(
  null,
  async (get, set, command: Omit<Command, "id">) => {
    const commands = get(commandsAtom)
    const newCommand: Command = {
      ...command,
      id: Date.now().toString()
    }
    const updatedCommands = [...commands, newCommand]
    await set(saveCommandsAtom, updatedCommands)
  }
)

export const updateCommandAtom = atom(
  null,
  async (get, set, params: { id: string; command: Omit<Command, "id"> }) => {
    const { id, command } = params
    const commands = get(commandsAtom)
    const updatedCommands = commands.map(cmd =>
      cmd.id === id ? { ...command, id } : cmd
    )
    await set(saveCommandsAtom, updatedCommands)
  }
)

export const deleteCommandAtom = atom(
  null,
  async (get, set, commandId: string) => {
    const commands = get(commandsAtom)
    const updatedCommands = commands.filter(cmd => cmd.id !== commandId)
    await set(saveCommandsAtom, updatedCommands)
  }
)
