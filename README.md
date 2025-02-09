# AI Agent Desktop Application

A modern desktop application built with Electron, React, and TypeScript that provides an intuitive chat interface with an AI agent powered by Ollama. The application supports various tools and capabilities, making it a versatile assistant for different tasks.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Ollama](https://ollama.ai/) installed and running locally
- The Llama 3.2 model pulled in Ollama (`ollama pull llama3.2`)

## Features

- 🤖 AI-powered chat interface with streaming responses
- 🛠️ Extensible tool system for custom capabilities
- 🎨 Modern, responsive UI with dark theme
- 📝 Rich text formatting support
- 🔄 Real-time progress indicators for agent actions
- 🧰 Built-in tools:
  - Weather information retrieval
  - Chat history management
  - Capability listing

## Installation

1. Clone the repository:

```bash
git clone https://github.com/uniquedm/ai-agent-poc.git
cd ai-agent-poc
```

2. Install dependencies:

```bash
npm install
```

3. Start Ollama server:

```bash
ollama serve
```

4. Start the application in development mode:

```bash
npm run dev
```

## Building the Application

To build the application for production:

```bash
npm run build
```

The built application will be available in the `dist` directory.

## Customizing the AI Model

The application uses Llama 3.2 by default, but you can change the model in `src/renderer/src/services/ollama.service.ts`:

```typescript
constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.2') {
  this.baseUrl = baseUrl
  this.model = model
}
```

Replace 'llama3.2' with any other model you have pulled in Ollama.

## Adding New Tools

The application supports an extensible tool system. To add a new tool:

1. Create a new tool implementation file in `src/renderer/src/tools/implementations/`:

```typescript
import { Tool } from '../../types/agent.types'
import { ToolDefinition, ToolImplementation } from '../types'

export const myNewTool: Tool = {
  type: 'function',
  function: {
    name: 'my_new_tool',
    description: 'Description of what your tool does',
    parameters: {
      type: 'object',
      properties: {
        // Define your tool's parameters here
      },
      required: [] // List required parameters
    }
  }
}

export const myNewImplementation: ToolImplementation = {
  execute: async (args: Record<string, any>) => {
    // Implement your tool's logic here
    return {
      success: true,
      data: {
        // Return your tool's response data
      }
    }
  }
}

export const myNewToolDefinition: ToolDefinition = {
  tool: myNewTool,
  implementation: myNewImplementation
}
```

2. Register your tool in `src/renderer/src/tools/registry.ts`:

```typescript
import { myNewToolDefinition } from './implementations/my-new-tool'

export const createToolsRegistry = (clearCallback: () => void): ToolRegistry => {
  const registry: ToolRegistry = {
    // ... existing tools
    [myNewToolDefinition.tool.function.name]: myNewToolDefinition
  }
  // ... rest of the code
}
```

## Architecture

The application follows a modular architecture:

- `src/renderer/src/services/` - Core services for AI and agent functionality
- `src/renderer/src/tools/` - Tool definitions and implementations
- `src/renderer/src/types/` - TypeScript type definitions
- `src/renderer/src/components/` - React components
- `src/main/` - Electron main process code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
