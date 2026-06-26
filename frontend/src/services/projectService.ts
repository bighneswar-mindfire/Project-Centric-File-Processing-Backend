import { apiFetch } from '../lib/apiClient';

export interface ProjectResponse {
  id: string;
  name: string;
  filesCount: number;
  jobsCount: number;
  description: string;
  createdAt: string;
}

export const projectService = {
  getProjects: async (): Promise<ProjectResponse[]> => {
    const response = await apiFetch('/api/projects');
    return response.json();
  },

  deleteProject: async (projectId: string): Promise<{ message: string }> => {
    const response = await apiFetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  getProjectDetails: async (projectId: string): Promise<ProjectResponse> => {
    const response = await apiFetch(`/api/projects/${projectId}`);
    return response.json();
  },

  createProject: async (name: string, description: string): Promise<ProjectResponse> => {
    const response = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return response.json();
  },
};
