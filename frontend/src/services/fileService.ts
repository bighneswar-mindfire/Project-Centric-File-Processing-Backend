const API_BASE_URL = '/api';

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
  //upload files using XMLHttpRequest
  uploadFiles: (
    projectId: string,
    files: File[],
    onProgress: (progress: number) => void,
  ): Promise<FileUploadResponse> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('token');

      xhr.open('POST', `${API_BASE_URL}/projects/${projectId}/files`);

      //authorization headers
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      //upload progress bar
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });

      //successful uploads
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            reject(new Error('Failed to parse server response.'));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error || 'Upload failed.'));
          } catch {
            reject(new Error('Upload failed.'));
          }
        }
      };

      //error
      xhr.onerror = () => {
        reject(new Error('Network error occurred during file upload.'));
      };

      //for api call
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      xhr.send(formData);
    });
  },

  //fetch files
  getFiles: async (projectId: string): Promise<FileMetadata[]> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch files.');
    }

    return response.json();
  },

  deleteFile: async (projectId: string, fileId: string): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete file.');
    }

    return response.json();
  },
};
