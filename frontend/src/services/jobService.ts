const API_BASE_URL = '/api';

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
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/jobs/zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to trigger compression job.');
    }

    return response.json();
  },

  getJobStatus: async (projectId: string, jobId: string): Promise<JobMetadata> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch job status.');
    }

    return response.json();
  },

  getJobs: async (projectId: string): Promise<JobMetadata[]> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/jobs`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch jobs list.');
    }

    return response.json();
  },
};
