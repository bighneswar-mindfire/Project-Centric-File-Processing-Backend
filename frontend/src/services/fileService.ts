import { apiFetch } from '../lib/apiClient';
import { PaginatedResponse } from './types';

export interface FileMetadata {
  fileId: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface FileUploadResponse {
  projectId: string;
  files: FileMetadata[];
}

export const fileService = {
  getFiles: async (
    projectId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<FileMetadata>> => {
    const response = await apiFetch(`/api/projects/${projectId}/files?page=${page}&limit=${limit}`);
    return response.json();
  },

  deleteFile: async (projectId: string, fileId: string): Promise<{ message: string }> => {
    const response = await apiFetch(`/api/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  uploadFiles: (
    projectId: string,
    files: File[],
    onProgress: (p: number) => void,
  ): Promise<FileUploadResponse> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('token');

      xhr.open('POST', `/api/projects/${projectId}/files`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      });

      xhr.onload = () => {
        // ─── ADD THE 401 CHECK FOR XHR HERE ───
        if (xhr.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
          return reject(new Error('Session expired.'));
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Upload failed.'));
        }
      };

      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      xhr.send(formData);
    });
  },
};
