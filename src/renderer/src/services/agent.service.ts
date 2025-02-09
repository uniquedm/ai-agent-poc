import { v4 as uuidv4 } from 'uuid'
import { ToolDefinition } from '../tools/types'
import {
  AgentProgress,
  AgentStep,
  AgentStepType,
  ChatMessage,
  OllamaMessage,
  ToolCall
} from '../types/agent.types'
import { OllamaService } from './ollama.service'

export class AgentService {
  private ollamaService: OllamaService
  private tools: Record<string, ToolDefinition> = {}
  private messageHistory: OllamaMessage[] = []

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService
  }

  initializeTools(toolsRegistry: Record<string, ToolDefinition>): void {
    this.tools = toolsRegistry
  }

  clearMessageHistory(): void {
    this.messageHistory = []
  }

  private createStep(
    type: AgentStepType,
    message: string,
    metadata?: AgentStep['metadata']
  ): AgentStep {
    return {
      id: uuidv4(),
      type,
      status: 'running',
      message,
      timestamp: new Date(),
      metadata
    }
  }

  private async executeToolCall(toolCall: ToolCall): Promise<any> {
    const tool = this.tools[toolCall.function.name]
    if (!tool) {
      throw new Error(`Tool ${toolCall.function.name} not found`)
    }
    return await tool.implementation.execute(toolCall.function.arguments)
  }

  private async checkIfNeedsTools(message: string): Promise<boolean> {
    // Get available tool descriptions
    const availableTools = Object.values(this.tools).map((tool) => ({
      name: tool.tool.function.name,
      description: tool.tool.function.description
    }))

    // Add a system message to help with intent classification
    const systemMessage: OllamaMessage = {
      role: 'system',
      content: `You are an AI assistant that helps determine if a user's message STRICTLY requires using any of our available tools to respond.
      Our available tools are:
      ${availableTools.map((tool) => `- ${tool.name}: ${tool.description}`).join('\n')}

      IMPORTANT RULES:
      1. Only respond with 'true' if the user's request SPECIFICALLY needs one of our available tools.
      2. Respond with 'false' for general knowledge questions, even if you know the answer.
      3. Respond with 'false' for general conversation or questions about topics not covered by our tools.
      4. Only respond with 'true' if the user's intent clearly matches a tool's specific purpose.
      5. When in doubt, respond with 'false'.
      6. ANY question about weather or temperature for ANY location should use get_current_weather.

      Examples of TRUE cases (requires tools):
      "What's the weather in Paris?" -> true (specifically needs get_current_weather)
      "What's the temperature in London?" -> true (specifically needs get_current_weather)
      "What's the weather like in India?" -> true (specifically needs get_current_weather)
      "How's the weather in Tokyo?" -> true (specifically needs get_current_weather)
      "Tell me the weather for New York" -> true (specifically needs get_current_weather)
      "What's the temperature in Brazil?" -> true (specifically needs get_current_weather)
      "Clear this conversation" -> true (specifically needs clear_chat)
      "What can you do?" -> true (specifically needs list_capabilities)

      Examples of FALSE cases (no tools needed):
      "How are you?" -> false (general conversation)
      "What is Bitcoin?" -> false (general knowledge)
      "When was Python created?" -> false (general knowledge)
      "What's the capital of France?" -> false (general knowledge)

      IMPORTANT: For ANY question about capabilities or features, respond with 'true' as these MUST use the list_capabilities tool.
      IMPORTANT: For ANY question containing words like "weather", "temperature", "forecast", "climate", "hot", "cold" along with a location name, respond with 'true' as these MUST use the get_current_weather tool.

      Respond ONLY with 'true' or 'false'. No other text.`
    }

    const response = await this.ollamaService.chat([
      systemMessage,
      { role: 'user', content: message }
    ])

    return response.message.content.toLowerCase().includes('true')
  }

  private formatResponseText(text: string): string {
    try {
      // First try to parse as JSON in case it's JSON-encoded
      let parsedContent: any
      try {
        parsedContent = JSON.parse(text)

        // Special handling for capabilities response
        if (parsedContent.data?.general_capabilities && parsedContent.data?.available_tools) {
          const capabilities = parsedContent.data.general_capabilities
            .map((cap: string) => {
              // Extract the main capability name (text before the colon)
              const [name, ...description] = cap.split(':')
              return `**${name}**${description.length ? ':' + description.join(':') : ''}`
            })
            .join('\n')
          const tools = parsedContent.data.available_tools
            .split('\n')
            .map((tool: string) => {
              // Extract tool name (text before the colon)
              const [name, ...description] = tool.split(':')
              return `**${name}**${description.length ? ':' + description.join(':') : ''}`
            })
            .join('\n')

          return `${parsedContent.message}\n\n**General Capabilities:**\n${capabilities}\n\n**Available Tools:**\n${tools}`
        }

        // For other JSON responses
        if (typeof parsedContent === 'object') {
          // If it's a tool response with a message field, use that
          if (parsedContent.message) {
            return parsedContent.message
          }
          // Otherwise stringify the object nicely
          return JSON.stringify(parsedContent, null, 2)
        }
        text = typeof parsedContent === 'string' ? parsedContent : text
      } catch {
        // If it's not JSON, use the text as is
      }

      // Replace \n with actual newlines
      text = text.replace(/\\n/g, '\n')

      // Remove extra quotes at the start and end if they exist
      text = text.replace(/^"|"$/g, '')

      // Clean up any remaining escaped quotes
      text = text.replace(/\\"/g, '"')

      // Format numbered lists with bold text
      text = text.replace(/(\d+\.\s+)\*\*([^*]+)\*\*:/g, '$1**$2**:')

      // Format bullet points with bold text
      text = text.replace(/(-\s+)\*\*([^*]+)\*\*:/g, '$1**$2**:')

      return text
    } catch (error) {
      console.error('Error formatting response:', error)
      return text // Return original text if formatting fails
    }
  }

  async processMessage(
    userMessage: string,
    onProgress: (progress: AgentProgress) => void
  ): Promise<ChatMessage> {
    const steps: AgentStep[] = []
    let currentStep: AgentStep

    try {
      // Step 1: Understanding Intent
      currentStep = this.createStep(
        AgentStepType.UNDERSTANDING_INTENT,
        'Understanding your request...'
      )
      onProgress({ currentStep, previousSteps: steps, isComplete: false })

      // Add user message to history
      this.messageHistory.push({
        role: 'user',
        content: userMessage
      })

      // Check if we need to use tools
      const needsTools = await this.checkIfNeedsTools(userMessage)
      steps.push({ ...currentStep, status: 'completed' })

      let finalResponse

      if (needsTools) {
        // Step 2: Selecting Tool
        currentStep = this.createStep(
          AgentStepType.SELECTING_TOOL,
          'Determining the best approach...'
        )
        onProgress({ currentStep, previousSteps: steps, isComplete: false })

        // Add a system message to guide tool selection
        const toolSelectionMessage: OllamaMessage = {
          role: 'system',
          content: `You are an AI assistant that helps select the most appropriate tool for a user's request.
          
          IMPORTANT RULES:
          1. For ANY command about clearing, erasing, or resetting the chat/conversation, use clear_chat.
          2. For ANY question about capabilities (e.g. "what can you do?", "show me your features", etc.), use list_capabilities.
          3. For ANY question about weather, temperature, forecast, climate, etc. for ANY location, use get_current_weather.
          4. If no tool is needed, respond to the user's question directly.
          
          You MUST use get_current_weather for these types of questions:
          - "What's the weather in [ANY LOCATION]?"
          - "How's the weather in [ANY LOCATION]?"
          - "Tell me the weather for [ANY LOCATION]"
          - "What's the temperature in [ANY LOCATION]?"
          - "Is it hot/cold in [ANY LOCATION]?"
          - "What's the forecast for [ANY LOCATION]?"
          
          When using get_current_weather:
          - Always extract the location from the user's question
          - Default to 'celsius' format unless 'fahrenheit' is specifically requested
          
          You MUST use clear_chat for these types of requests:
          - "Clear the chat"
          - "Clear this conversation"
          - "Reset chat"
          
          You MUST use list_capabilities for these types of questions:
          - "What can you do?"
          - "Show me your capabilities"
          - "What are your features?"
          
          DO NOT provide a general response - ALWAYS use the appropriate tool.`
        }

        // Call Ollama with tools
        const toolDefinitions = Object.values(this.tools).map((t) => t.tool)
        const response = await this.ollamaService.chat(
          [toolSelectionMessage, ...this.messageHistory],
          toolDefinitions
        )
        steps.push({ ...currentStep, status: 'completed' })

        // If tool calls are present and relevant, execute them
        if (response.message.tool_calls && response.message.tool_calls.length > 0) {
          for (const toolCall of response.message.tool_calls) {
            // Step 3: Executing Tool
            currentStep = this.createStep(
              AgentStepType.EXECUTING_TOOL,
              `Using ${toolCall.function.name}...`,
              { toolName: toolCall.function.name }
            )
            onProgress({ currentStep, previousSteps: steps, isComplete: false })

            const result = await this.executeToolCall(toolCall)
            steps.push({ ...currentStep, status: 'completed' })

            // Add tool result to message history
            this.messageHistory.push({
              role: 'assistant',
              content: JSON.stringify(result)
            })

            // For capabilities and clear chat, use the result directly
            if (
              toolCall.function.name === 'list_capabilities' ||
              toolCall.function.name === 'clear_chat'
            ) {
              finalResponse = {
                message: {
                  role: 'assistant',
                  content: JSON.stringify(result)
                }
              }
              break // Exit the loop since we have our final response
            }
          }

          // Step 4: Processing Result
          currentStep = this.createStep(AgentStepType.PROCESSING_RESULT, 'Processing results...')
          onProgress({ currentStep, previousSteps: steps, isComplete: false })
          steps.push({ ...currentStep, status: 'completed' })
        }
      }

      // Final response from Ollama (if not already set by a tool)
      if (!finalResponse) {
        finalResponse = await this.ollamaService.chat(this.messageHistory)
      }
      this.messageHistory.push(finalResponse.message)

      // Step 5: Complete
      currentStep = this.createStep(AgentStepType.FORMULATING_RESPONSE, 'Preparing response...')
      onProgress({ currentStep, previousSteps: steps, isComplete: false })
      steps.push({ ...currentStep, status: 'completed' })

      // Format the response text
      const formattedText = this.formatResponseText(finalResponse.message.content)

      return {
        id: Date.now(),
        text: formattedText,
        sender: 'ai',
        timestamp: new Date(),
        status: 'complete',
        progress: {
          currentStep: { ...currentStep, status: 'completed' },
          previousSteps: steps,
          isComplete: true
        }
      }
    } catch (error: unknown) {
      console.error('Error in agent processing:', error)
      currentStep = this.createStep(
        AgentStepType.ERROR,
        'An error occurred while processing your request',
        { error: error instanceof Error ? error.message : 'Unknown error occurred' }
      )
      steps.push({ ...currentStep, status: 'error' })
      onProgress({ currentStep, previousSteps: steps, isComplete: true })

      return {
        id: Date.now(),
        text: 'I apologize, but I encountered an error while processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'error',
        progress: {
          currentStep,
          previousSteps: steps,
          isComplete: true
        }
      }
    }
  }
}
