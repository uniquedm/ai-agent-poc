import { Tool } from '../../types/agent.types'
import { ToolDefinition, ToolImplementation } from '../types'

export const weatherTool: Tool = {
  type: 'function',
  function: {
    name: 'get_current_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: "The location to get the weather for, e.g. 'San Francisco, CA'"
        },
        format: {
          type: 'string',
          description: "The format to return the weather in, e.g. 'celsius' or 'fahrenheit'",
          enum: ['celsius', 'fahrenheit']
        }
      },
      required: ['location', 'format']
    }
  }
}

export const weatherImplementation: ToolImplementation = {
  execute: async (args: Record<string, any>) => {
    const location = args.location as string
    const format = args.format as string
    return {
      success: true,
      data: {
        location,
        temperature: format === 'celsius' ? 22 : 72,
        unit: format,
        condition: 'sunny'
      }
    }
  }
}

export const weatherDefinition: ToolDefinition = {
  tool: weatherTool,
  implementation: weatherImplementation
}
