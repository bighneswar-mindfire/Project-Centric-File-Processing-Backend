const API_BASE_URL = '/api';

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const projectService = {
  // send data to db
  createProject: async (name: string, description: string): Promise<ProjectResponse> => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create project.');
    }

    return response.json();
  },
};
