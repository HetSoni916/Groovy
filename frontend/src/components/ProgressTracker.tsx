import { Check, Loader2, Clock } from 'lucide-react'
import clsx from 'clsx'
import type { ProcessingStep } from '../types'

interface ProgressTrackerProps {
  steps: ProcessingStep[]
  progress: number
}

const statusIcons = {
  completed: Check,
  in_progress: Loader2,
  pending: Clock,
}

const statusColors = {
  completed: 'text-green-400 border-green-400/30 bg-green-400/10',
  in_progress: 'text-accent-light border-accent/30 bg-accent/10',
  pending: 'text-dark-400 border-dark-600 bg-dark-700/50',
}

export default function ProgressTracker({ steps, progress }: ProgressTrackerProps) {
  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark-300">Processing Progress</span>
          <span className="text-accent-light font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = statusIcons[step.status]
          const isInProgress = step.status === 'in_progress'
          return (
            <div
              key={step.key}
              className={clsx(
                'flex items-center gap-4 p-3 rounded-xl border transition-all duration-300',
                statusColors[step.status],
                isInProgress && 'animate-pulse-slow'
              )}
            >
              <div className={clsx(
                'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                step.status === 'completed' && 'bg-green-400/20',
                step.status === 'in_progress' && 'bg-accent/20',
                step.status === 'pending' && 'bg-dark-600'
              )}>
                <Icon className={clsx(
                  'w-4 h-4',
                  isInProgress && 'animate-spin'
                )} />
              </div>
              <span className={clsx(
                'text-sm font-medium',
                step.status === 'completed' && 'text-green-300',
                step.status === 'in_progress' && 'text-accent-light',
                step.status === 'pending' && 'text-dark-400'
              )}>
                {step.label}
              </span>
              {step.status === 'completed' && (
                <div className="ml-auto">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
