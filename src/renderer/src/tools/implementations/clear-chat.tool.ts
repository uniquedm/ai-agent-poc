import { Tool } from '../../types/agent.types'
import { ToolDefinition, ToolImplementation } from '../types'

export const clearChatTool: Tool = {
  type: 'function',
  function: {
    name: 'clear_chat',
    description: 'Clears the current chat history and conversation',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
}

export class ClearChatImplementation implements ToolImplementation {
  private clearCallback: () => void

  constructor(clearCallback: () => void) {
    this.clearCallback = clearCallback
  }

  execute = async () => {
    this.clearCallback()
    return {
      success: true,
      message: 'Chat history has been cleared successfully.'
    }
  }
}

export const createClearChatDefinition = (clearCallback: () => void): ToolDefinition => ({
  tool: clearChatTool,
  implementation: new ClearChatImplementation(clearCallback)
})
