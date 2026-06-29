export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  dropbox_link: string | null;
  status: ProjectStatus;
  progress: number;
  final_video_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus =
  | 'pending'
  | 'link_added'
  | 'files_uploaded'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Clip {
  id: string;
  project_id: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  quality_score: number;
  clip_metadata: ClipMetadata | null;
  created_at: string;
}

export interface ClipMetadata {
  clip: string;
  type: string;
  scene: string;
  quality: number;
  emotion: string;
  best_segments: string[];
}

export interface ProjectStatusResponse {
  id: string;
  status: ProjectStatus;
  progress: number;
  current_step: string | null;
  error_message: string | null;
}

export interface CreateProjectRequest {
  dropbox_link?: string;
  name?: string;
}

export interface UploadFilesResponse {
  project_id: string;
  files: string[];
  count: number;
}

export interface UploadDropboxLinkRequest {
  project_id: string;
  dropbox_link: string;
}

export type ProcessingStepStatus = 'pending' | 'in_progress' | 'completed';

export interface ProcessingStep {
  key: string;
  label: string;
  status: ProcessingStepStatus;
}

export interface ProjectClip {
  id: string;
  project_id: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  quality_score: number;
  clip_metadata: ClipMetadata | null;
  created_at: string;
}

export const STEPS = [
  'dropbox_connected',
  'downloading',
  'analyzing',
  'selecting',
  'creating_story',
  'adding_transitions',
  'syncing_music',
  'rendering',
  'completed',
];

export const PROCESSING_STEPS = [
  'Videos Ready',
  'AI Analyzing Scenes',
  'Selecting Best Shots',
  'Creating Story',
  'Adding Transitions',
  'Syncing Music',
  'Rendering Final Video',
];
