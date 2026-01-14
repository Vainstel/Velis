import pkg from "node-machine-id"
const { machineIdSync } = pkg

/**
 * Generate a unique client ID based on machine hardware
 * This ID is used locally only and never sent to external services
 */
export const CLIENT_ID = machineIdSync()
