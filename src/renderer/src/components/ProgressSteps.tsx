import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import PendingIcon from '@mui/icons-material/Pending'
import { Box, Paper, Typography } from '@mui/material'
import { AgentProgress, AgentStep, StepStatus } from '../types/agent'

interface ProgressStepsProps {
  progress: AgentProgress
}

const getStepIcon = (status: StepStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon sx={{ color: 'success.main' }} />
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main' }} />
    case 'running':
      return <PendingIcon sx={{ color: 'info.main' }} className="rotating" />
    default:
      return null
  }
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ progress }) => {
  const allSteps = [...progress.previousSteps, progress.currentStep]

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        bgcolor: 'background.paper',
        borderRadius: 1,
        mb: 1
      }}
    >
      {allSteps.map((step: AgentStep) => (
        <Box
          key={step.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 0.5,
            opacity: step.status === 'completed' ? 0.7 : 1
          }}
        >
          {getStepIcon(step.status)}
          <Typography variant="body2">{step.message}</Typography>
        </Box>
      ))}
    </Paper>
  )
}
