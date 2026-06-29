import axios from 'axios';
import type {
  Project,
  ProjectStatusResponse,
  CreateProjectRequest,
  UploadFilesResponse,
  Clip,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const projectApi = {
  create: async (data: CreateProjectRequest): Promise<Project> => {
    const res = await api.post('/create-project', data);
    return res.data;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const res = await api.post('/create-project', data);
    return res.data;
  },

  uploadFiles: async (
    projectId: string,
    files: File[]
  ): Promise<UploadFilesResponse> => {
    const form = new FormData();
    form.append('project_id', projectId);
    files.forEach((f) => form.append('files', f));
    const res = await api.post('/upload-files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  uploadDropboxLink: async (
    projectId: string,
    dropboxLink: string
  ): Promise<Project> => {
    const res = await api.post('/upload-dropbox-link', {
      project_id: projectId,
      dropbox_link: dropboxLink,
    });
    return res.data;
  },

  analyzeClips: async (projectId: string, dropboxLink?: string): Promise<{ clips: Clip[]; count: number }> => {
    const params = new URLSearchParams();
    params.append('project_id', projectId);
    if (dropboxLink) params.append('dropbox_link', dropboxLink);
    const res = await api.post(`/analyze-clips?${params.toString()}`);
    return res.data;
  },

  generateVideo: async (projectId: string): Promise<Project> => {
    const res = await api.post(`/generate-video?project_id=${projectId}`);
    return res.data;
  },

  getStatus: async (projectId: string): Promise<ProjectStatusResponse> => {
    const res = await api.get(`/project-status/${projectId}`);
    return res.data;
  },

  getProjectStatus: async (projectId: string): Promise<ProjectStatusResponse> => {
    const res = await api.get(`/project-status/${projectId}`);
    return res.data;
  },

  listProjects: async (): Promise<Project[]> => {
    const res = await api.get('/projects');
    return res.data;
  },

  download: async (projectId: string): Promise<Blob> => {
    const res = await api.get(`/download/${projectId}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  downloadVideo: (filename: string): string => {
    return `/api/download/${filename}`;
  },

  previewVideo: (filename: string): string => {
    return `/api/preview/${filename}`;
  },

  generateFromPrompt: async (prompt: string, name?: string): Promise<Project> => {
    const res = await api.post('/generate-from-prompt', { prompt, name: name || 'AI Prompt Video' });
    return res.data;
  },

  analyzePrompt: async (prompt: string): Promise<any> => {
    const res = await api.post('/analyze-prompt', { prompt });
    return res.data;
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const res = await api.get('/health');
    return res.data;
  },
};
