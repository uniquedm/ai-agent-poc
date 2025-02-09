import CloseIcon from '@mui/icons-material/Close'
import MaximizeIcon from '@mui/icons-material/CropSquare'
import MinimizeIcon from '@mui/icons-material/Remove'
import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  Container,
  createTheme,
  CssBaseline,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  ThemeProvider,
  Typography
} from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { ProgressIndicator } from './components/ProgressIndicator'
import { AgentService } from './services/agent.service'
import { OllamaService } from './services/ollama.service'
import { createToolsRegistry } from './tools/registry'
import { AgentProgress, ChatMessage } from './types/agent.types'

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
})

// Initialize services
const ollamaService = new OllamaService()

// Add this helper function to format message text with bold formatting
const formatMessageText = (text: string) => {
  return text.split('\n').map((line, i) => {
    // Handle bold text (**text**)
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const formattedParts = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove ** and make text bold
        return <strong key={`${i}-${j}`}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    return (
      <React.Fragment key={i}>
        {formattedParts}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    )
  })
}

function App(): JSX.Element {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: 'Hello! How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
      status: 'complete'
    }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [agentService] = useState(() => {
    // Create agent service with tools registry
    const agent = new AgentService(ollamaService)
    const clearChat = () => {
      setMessages([
        {
          id: Date.now(),
          text: 'Chat history has been cleared. How can I help you?',
          sender: 'ai',
          timestamp: new Date(),
          status: 'complete'
        }
      ])
      agent.clearMessageHistory()
    }
    agent.initializeTools(createToolsRegistry(clearChat))
    return agent
  })

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (): Promise<void> => {
    if (message.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now(),
        text: message.trim(),
        sender: 'user',
        timestamp: new Date(),
        status: 'complete'
      }

      // Create a placeholder for AI response
      const aiPlaceholder: ChatMessage = {
        id: Date.now() + 1,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        status: 'processing'
      }

      setMessages((prev) => [...prev, userMessage, aiPlaceholder])
      setMessage('')

      try {
        // Process message with agent
        const response = await agentService.processMessage(
          userMessage.text,
          (progress: AgentProgress) => {
            // Update the AI message with progress
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiPlaceholder.id
                  ? {
                      ...msg,
                      progress
                    }
                  : msg
              )
            )
          }
        )

        // Update the AI message with the final response
        setMessages((prev) => prev.map((msg) => (msg.id === aiPlaceholder.id ? response : msg)))
      } catch (error) {
        // Update the AI message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiPlaceholder.id
              ? {
                  ...msg,
                  text: 'I apologize, but I encountered an error. Please try again.',
                  status: 'error'
                }
              : msg
          )
        )
      }
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleKeyPress = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleWindowControls = (action: 'minimize' | 'maximize' | 'close'): void => {
    window.electron.ipcRenderer.send(`window-${action}`)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {/* Titlebar */}
      <Box
        sx={{
          height: 32,
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          WebkitAppRegion: 'drag'
        }}
      >
        <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
          AI AGENT
        </Typography>
        <Box sx={{ WebkitAppRegion: 'no-drag' }}>
          <IconButton
            size="small"
            onClick={() => handleWindowControls('minimize')}
            sx={{
              width: 24,
              height: 24,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <MinimizeIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleWindowControls('maximize')}
            sx={{
              width: 24,
              height: 24,
              mx: 1,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <MaximizeIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleWindowControls('close')}
            sx={{
              width: 24,
              height: 24,
              '&:hover': {
                bgcolor: 'error.main',
                '& .MuiSvgIcon-root': { color: 'common.white' }
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ height: 'calc(100vh - 32px)', py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Chat Messages Area */}
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              mb: 2,
              p: 2,
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 2,
              '&::-webkit-scrollbar': {
                width: '8px',
                background: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)'
                }
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent'
              }
            }}
          >
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: msg.sender === 'user' ? 'info.dark' : 'background.paper',
                    borderRadius: 2,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <Typography variant="body1" component="div">
                    {formatMessageText(msg.text)}
                  </Typography>
                  {msg.progress && <ProgressIndicator progress={msg.progress} />}
                </Paper>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.7,
                    mt: 0.5,
                    px: 1
                  }}
                >
                  {formatTime(msg.timestamp)}
                </Typography>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Paper>

          {/* Input Area */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      color="primary"
                      onClick={() => handleSend()}
                      disabled={!message.trim()}
                      sx={{
                        mr: -1,
                        width: 32,
                        height: 32,
                        '&:hover': {
                          bgcolor: 'transparent',
                          '& .MuiSvgIcon-root': {
                            color: 'primary.light'
                          }
                        },
                        '&.Mui-disabled': {
                          color: 'action.disabled'
                        }
                      }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
