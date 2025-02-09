import { Message, OllamaResponse, Tool } from '../types/agent'

const OLLAMA_BASE_URL = 'http://localhost:11434'

export class OllamaService {
  private model: string
  private baseUrl: string

  constructor(model: string = 'llama3.2', baseUrl: string = OLLAMA_BASE_URL) {
    this.model = model
    this.baseUrl = baseUrl
  }

  async chat(messages: Message[], tools?: Tool[]): Promise<OllamaResponse> {
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
      console.error('Error calling Ollama:', error)
      throw error
    }
  }

  setModel(model: string): void {
    this.model = model
  }
}
