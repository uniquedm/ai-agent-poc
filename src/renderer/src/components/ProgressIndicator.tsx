import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import PendingIcon from '@mui/icons-material/Pending'
import { Box, Paper, Typography } from '@mui/material'
import { AgentProgress, AgentStepType } from '../types/agent.types'

const stepTypeToLabel = {
  [AgentStepType.UNDERSTANDING_INTENT]: 'Understanding Request',
  [AgentStepType.SELECTING_TOOL]: 'Selecting Approach',
  [AgentStepType.EXECUTING_TOOL]: 'Executing Action',
  [AgentStepType.PROCESSING_RESULT]: 'Processing Results',
  [AgentStepType.FORMULATING_RESPONSE]: 'Preparing Response',
  [AgentStepType.ERROR]: 'Error'
}

interface ProgressIndicatorProps {
  progress: AgentProgress
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => {
  const { currentStep, previousSteps, isComplete } = progress
  const allSteps = [...previousSteps, currentStep]

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        my: 1,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {allSteps.map((step) => (
        <Box
          key={step.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 0.5,
            opacity: step.status === 'completed' ? 0.7 : 1
          }}
        >
          {step.status === 'completed' ? (
            <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
          ) : step.status === 'error' ? (
            <ErrorIcon color="error" sx={{ mr: 1, fontSize: '1rem' }} />
          ) : (
            <PendingIcon
              color="primary"
              sx={{ mr: 1, fontSize: '1rem', animation: 'spin 1s linear infinite' }}
            />
          )}
          <Typography variant="body2" sx={{ flex: 1 }}>
            {stepTypeToLabel[step.type]}: {step.message}
            {step.metadata?.toolName && ` (${step.metadata.toolName})`}
          </Typography>
        </Box>
      ))}
    </Paper>
  )
}

// Add the keyframes for the spinning animation
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`
document.head.appendChild(style)
