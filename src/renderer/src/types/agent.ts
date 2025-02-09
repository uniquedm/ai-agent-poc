export enum AgentStepType {
  UNDERSTANDING_INTENT = 'understanding_intent',
  SELECTING_TOOL = 'selecting_tool',
  EXECUTING_TOOL = 'executing_tool',
  PROCESSING_RESULT = 'processing_result',
  FORMULATING_RESPONSE = 'formulating_response',
  ERROR = 'error'
}

export type StepStatus = 'running' | 'completed' | 'error'

export interface AgentStep {
  id: string
  type: AgentStepType
  status: StepStatus
  message: string
  timestamp: Date
  metadata?: {
    toolName?: string
    duration?: number
    error?: string
  }
}

export interface AgentProgress {
  currentStep: AgentStep
  previousSteps: AgentStep[]
  isComplete: boolean
}

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, ToolParameter>
      required: string[]
    }
  }
}

export interface ToolParameter {
  type: string
  description: string
  enum?: string[]
}

export interface ToolCall {
  function: {
    name: string
    arguments: Record<string, any>
  }
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  tool_calls?: ToolCall[]
}

export interface OllamaResponse {
  model: string
  created_at: string
  message: Message
  done: boolean
  total_duration: number
}

export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  progress?: AgentProgress
  toolCalls?: ToolCall[]
  status: 'pending' | 'processing' | 'complete' | 'error'
}
