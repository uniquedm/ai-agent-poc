import { Tool } from '../../types/agent.types'
import { ToolDefinition, ToolImplementation } from '../types'

export const listCapabilitiesTool: Tool = {
  type: 'function',
  function: {
    name: 'list_capabilities',
    description: 'Lists all available tools and capabilities of the AI assistant',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
}

export const listCapabilitiesImplementation: ToolImplementation = {
  execute: async () => {
    return {
      success: true,
      message:
        'I can help you with various tasks using natural language processing and specific tools.',
      data: {
        general_capabilities: [
          'Natural language understanding and conversation',
          'Answering questions and providing information',
          'Text analysis and processing',
          'Problem-solving and reasoning',
          'Creative writing and text generation'
        ],
        available_tools: [] // Will be populated by registry
      }
    }
  }
}

export const listCapabilitiesDefinition: ToolDefinition = {
  tool: listCapabilitiesTool,
  implementation: listCapabilitiesImplementation
}
