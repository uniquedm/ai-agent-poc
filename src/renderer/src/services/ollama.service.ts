import { OllamaMessage, OllamaResponse, Tool } from '../types/agent.types'

export class OllamaService {
  private baseUrl: string
  private model: string

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.2') {
    this.baseUrl = baseUrl
    this.model = model
  }

  async chat(messages: OllamaMessage[], tools?: Tool[]): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          ...(tools && { tools })
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as OllamaResponse
    } catch (error) {
      console.error('Error calling Ollama API:', error)
      throw error
    }
  }

  async chatWithProgress(
    messages: OllamaMessage[],
    tools?: Tool[],
    onProgress?: (response: OllamaResponse) => void
  ): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          ...(tools && { tools })
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is null')
      }

      let completeResponse: OllamaResponse | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Convert the Uint8Array to a string
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          const response = JSON.parse(line) as OllamaResponse
          if (onProgress) {
            onProgress(response)
          }
          if (response.done) {
            completeResponse = response
          }
        }
      }

      if (!completeResponse) {
        throw new Error('No complete response received')
      }

      return completeResponse
    } catch (error) {
      console.error('Error in streaming chat:', error)
      throw error
    }
  }
}
