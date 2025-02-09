import { Tool } from '../types/agent.types'

export interface ToolImplementation {
  execute: (args: Record<string, any>) => Promise<any>
}

export interface ToolDefinition {
  tool: Tool
  implementation: ToolImplementation
}

export interface ToolRegistry {
  [toolName: string]: ToolDefinition
}
