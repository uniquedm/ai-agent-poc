import { createClearChatDefinition } from './implementations/clear-chat.tool'
import { listCapabilitiesDefinition } from './implementations/list-capabilities.tool'
import { weatherDefinition } from './implementations/weather.tool'
import { ToolRegistry } from './types'

// Initialize the tools registry with all available tools
export const createToolsRegistry = (clearCallback: () => void): ToolRegistry => {
  const registry: ToolRegistry = {
    [listCapabilitiesDefinition.tool.function.name]: listCapabilitiesDefinition,
    [weatherDefinition.tool.function.name]: weatherDefinition
  }

  // Add clear chat with callback
  const clearChatDef = createClearChatDefinition(clearCallback)
  registry[clearChatDef.tool.function.name] = clearChatDef

  // Update list capabilities tool with current tools
  updateListCapabilitiesTools(registry)

  return registry
}

// Helper function to get all tool definitions
export const getAllTools = (registry: ToolRegistry) => Object.values(registry)

// Helper function to get tool descriptions
export const getToolDescriptions = (registry: ToolRegistry) => {
  return Object.values(registry)
    .map((def) => `${def.tool.function.name}: ${def.tool.function.description}`)
    .join('\n')
}

// Update list capabilities tool with current tools
const updateListCapabilitiesTools = (registry: ToolRegistry) => {
  const currentImpl = listCapabilitiesDefinition.implementation
  const originalExecute = currentImpl.execute

  currentImpl.execute = async (args) => {
    const result = await originalExecute(args)
    if (result.data) {
      result.data.available_tools = getToolDescriptions(registry)
    }
    return result
  }
}
