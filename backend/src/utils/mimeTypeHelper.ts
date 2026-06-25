import path from 'path';

export const getMimeType = (filename: string, clientMime: string): string => {
  if (clientMime === 'application/octet-stream') {
    const ext = path.extname(filename).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.zip': 'application/zip',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };

    return mimeMap[ext] || clientMime;
  }
  return clientMime;
};
