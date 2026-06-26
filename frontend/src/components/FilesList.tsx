import React from 'react';
import { Trash, File as FileIcon } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { fileService, FileMetadata } from '../services/fileService';

interface FilesListProps {
  projectId: string;
  files: FileMetadata[];
  onDeleteSuccess: (fileId: string) => void;
  selectedFileIds: string[];
  toggleFileSelectionForZip: (fileId: string) => void;
  onError: (title: string, message: string) => void;
}

export const FilesList: React.FC<FilesListProps> = ({
  projectId,
  files,
  onDeleteSuccess,
  selectedFileIds,
  toggleFileSelectionForZip,
  onError,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!projectId) return;
    try {
      await fileService.deleteFile(projectId, fileId);
      onDeleteSuccess(fileId);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed.';
      onError('Delete Failed', errorMsg);
    }
  };

  return (
    // file list
    <div className="space-y-3 pt-2">
      <h4 className="text-sm font-semibold text-slate-900">Uploaded Files</h4>
      {files.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No files uploaded.</p>
      ) : (
        <ScrollArea className="h-72 border border-slate-200 rounded-lg bg-white">
          <div className="divide-y divide-slate-100">
            {files.map((file) => (
              <div
                key={file.fileId}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3 truncate">
                  <Checkbox
                    checked={selectedFileIds.includes(file.fileId)}
                    onCheckedChange={() => toggleFileSelectionForZip(file.fileId)}
                    className="cursor-pointer"
                  />
                  <FileIcon className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p
                      className="text-xs font-medium text-slate-900 truncate max-w-sm"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Size: {formatBytes(file.size)} • Uploaded:{' '}
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteFile(file.fileId)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-red-500 cursor-pointer"
                    title="Delete File"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
