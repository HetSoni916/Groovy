import { useState, useCallback, useRef, useEffect } from 'react'
import { projectApi } from '../services/api'
import type { Project, ProjectClip, ProjectStatusResponse, ProcessingStep } from '../types'

interface UseProjectReturn {
  project: Project | null
  clips: ProjectClip[]
  status: ProjectStatusResponse | null
  steps: ProcessingStep[]
  loading: boolean
  error: string | null
  createProject: (link: string) => Promise<Project>
  startProcessing: () => Promise<void>
  pollStatus: (projectId: string) => void
  stopPolling: () => void
  downloadVideo: () => Promise<void>
}

const STEP_MAP: Record<string, string> = {
  pending: 'pending',
  connected: 'dropbox_connected',
  downloading: 'downloading',
  analyzing: 'analyzing',
  analyzed: 'selecting',
  editing: 'creating_story',
  rendering: 'rendering',
  completed: 'completed',
  failed: 'failed',
}

const STEP_ORDER = [
  'dropbox_connected',
  'downloading',
  'analyzing',
  'selecting',
  'creating_story',
  'adding_transitions',
  'syncing_music',
  'rendering',
  'completed',
]

function getSteps(currentStatus: string, currentStep: string): ProcessingStep[] {
  const activeStep = STEP_MAP[currentStatus] || currentStep || 'pending'
  const activeIndex = STEP_ORDER.indexOf(activeStep)

  return STEP_ORDER.map((key, i) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    status: i < activeIndex ? 'completed' : i === activeIndex ? 'in_progress' : 'pending',
  } as ProcessingStep))
}

export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null)
  const [clips, setClips] = useState<ProjectClip[]>([])
  const [status, setStatus] = useState<ProjectStatusResponse | null>(null)
  const [steps, setSteps] = useState<ProcessingStep[]>(getSteps('pending', ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const createProject = useCallback(async (link: string) => {
    setLoading(true)
    setError(null)
    try {
      const p = await projectApi.create({ dropbox_link: link })
      setProject(p)
      return p
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create project')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const startProcessing = useCallback(async () => {
    if (!project || !project.dropbox_link) return
    setLoading(true)
    setError(null)
    try {
      await projectApi.uploadDropboxLink(project.id, project.dropbox_link)
      setSteps(getSteps('connected', ''))
      const result = await projectApi.analyzeClips(project.id, project.dropbox_link)
      setClips(result.clips)
      setSteps(getSteps('analyzed', ''))
      await projectApi.generateVideo(project.id)
      setSteps(getSteps('rendering', ''))
      pollStatus(project.id)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Processing failed')
      setSteps(getSteps('failed', ''))
    } finally {
      setLoading(false)
    }
  }, [project])

  const pollStatus = useCallback((projectId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const s = await projectApi.getStatus(projectId)
        setStatus(s)
        setSteps(getSteps(s.status, s.current_step || ''))
        if (s.status === 'completed' || s.status === 'failed') {
          stopPolling()
        }
      } catch {
        // ignore polling errors
      }
    }, 2000)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const downloadVideo = useCallback(async () => {
    if (!project) return
    try {
      const blob = await projectApi.download(project.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'final_video.mp4'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError('Download failed')
    }
  }, [project])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  return {
    project,
    clips,
    status,
    steps,
    loading,
    error,
    createProject,
    startProcessing,
    pollStatus,
    stopPolling,
    downloadVideo,
  }
}
