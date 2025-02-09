import { v4 as uuidv4 } from 'uuid'
import { AgentProgress, AgentStep, AgentStepType, ChatMessage, Message, Tool } from '../types/agent'
import { OllamaService } from './ollama'

export class AgentService {
  private ollama: OllamaService
  private tools: Map<string, Tool>
  private messageHistory: Message[]

  constructor() {
    this.ollama = new OllamaService()
    this.tools = new Map()
    this.messageHistory = []
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.function.name, tool)
  }

  private createStep(type: AgentStepType, message: string): AgentStep {
    return {
      id: uuidv4(),
      type,
      status: 'running',
      message,
      timestamp: new Date()
    }
  }

  private async updateProgress(
    onProgress: (progress: AgentProgress) => void,
    currentStep: AgentStep,
    previousSteps: AgentStep[]
  ): Promise<void> {
    onProgress({
      currentStep,
      previousSteps,
      isComplete: false
    })
  }

  async processUserMessage(
    userMessage: string,
    onProgress: (progress: AgentProgress) => void
  ): Promise<ChatMessage> {
    const steps: AgentStep[] = []
    let currentStep: AgentStep

    // Step 1: Understanding Intent
    currentStep = this.createStep(
      AgentStepType.UNDERSTANDING_INTENT,
      'Understanding your request...'
    )
    await this.updateProgress(onProgress, currentStep, steps)

    // Add user message to history
    this.messageHistory.push({
      role: 'user',
      content: userMessage
    })

    try {
      // Call LLM with tools
      const toolsArray = Array.from(this.tools.values())

      // Step 2: Selecting Tool
      currentStep.status = 'completed'
      steps.push(currentStep)
      currentStep = this.createStep(
        AgentStepType.SELECTING_TOOL,
        'Selecting the appropriate tool...'
      )
      await this.updateProgress(onProgress, currentStep, steps)

      const response = await this.ollama.chat(this.messageHistory, toolsArray)

      // If tool calls are present, execute them
      if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        currentStep.status = 'completed'
        steps.push(currentStep)

        // Step 3: Executing Tool
        currentStep = this.createStep(
          AgentStepType.EXECUTING_TOOL,
          `Executing ${response.message.tool_calls[0].function.name}...`
        )
        await this.updateProgress(onProgress, currentStep, steps)

        // Here you would actually execute the tool
        // For now, we'll just simulate tool execution
        await new Promise((resolve) => setTimeout(resolve, 1000))

        currentStep.status = 'completed'
        steps.push(currentStep)

        // Step 4: Processing Result
        currentStep = this.createStep(AgentStepType.PROCESSING_RESULT, 'Processing the results...')
        await this.updateProgress(onProgress, currentStep, steps)
      }

      // Step 5: Formulating Response
      currentStep.status = 'completed'
      steps.push(currentStep)
      currentStep = this.createStep(
        AgentStepType.FORMULATING_RESPONSE,
        'Formulating the response...'
      )
      await this.updateProgress(onProgress, currentStep, steps)

      // Add assistant's response to history
      this.messageHistory.push(response.message)

      currentStep.status = 'completed'
      steps.push(currentStep)

      // Return final chat message
      return {
        id: uuidv4(),
        text: response.message.content,
        sender: 'ai',
        timestamp: new Date(),
        status: 'complete',
        toolCalls: response.message.tool_calls,
        progress: {
          currentStep,
          previousSteps: steps,
          isComplete: true
        }
      }
    } catch (error) {
      console.error('Error in agent processing:', error)
      currentStep.status = 'error'
      currentStep.metadata = {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
      steps.push(currentStep)

      const errorStep = this.createStep(
        AgentStepType.ERROR,
        'An error occurred while processing your request.'
      )
      errorStep.status = 'error'

      return {
        id: uuidv4(),
        text: 'I apologize, but I encountered an error while processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'error',
        progress: {
          currentStep: errorStep,
          previousSteps: steps,
          isComplete: true
        }
      }
    }
  }
}
