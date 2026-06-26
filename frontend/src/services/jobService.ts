import { apiFetch } from '../lib/apiClient';
import { PaginatedResponse } from './types';

export interface JobMetadata {
  jobId: string;
  projectId: string;
  type: 'ZIP_COMPRESSION';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  fileIds: string[];
  outputFileId?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export const jobService = {
  createZipJob: async (projectId: string, fileIds: string[]): Promise<JobMetadata> => {
    const response = await apiFetch(`/api/projects/${projectId}/jobs/zip`, {
      method: 'POST',
      body: JSON.stringify({ fileIds }),
    });
    return response.json();
  },

  getJobStatus: async (projectId: string, jobId: string): Promise<JobMetadata> => {
    const response = await apiFetch(`/api/projects/${projectId}/jobs/${jobId}`);
    return response.json();
  },

  getJobs: async (
    projectId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<JobMetadata>> => {
    const response = await apiFetch(`/api/projects/${projectId}/jobs?page=${page}&limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch jobs list.');
    }

    return response.json();
  },
};
