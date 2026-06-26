import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { UploadsSection } from './UploadsSection'; // Imported UploadsSection
import { FilesList } from './FilesList'; // Imported FilesList
import { FileMetadata } from '../services/fileService';
import { ProjectResponse } from '../services/projectService';

interface FilesWorkspaceProps {
  projectId: string;
  project: ProjectResponse | null;
  setProject: React.Dispatch<React.SetStateAction<ProjectResponse | null>>;
  files: FileMetadata[];
  setFiles: React.Dispatch<React.SetStateAction<FileMetadata[]>>;
  selectedFileIds: string[];
  toggleFileSelectionForZip: (fileId: string) => void;
  onError: (title: string, message: string) => void;
  onSuccess: (title: string, message: string) => void;
}

export const FilesWorkspace: React.FC<FilesWorkspaceProps> = ({
  projectId,
  project,
  setProject,
  files,
  setFiles,
  selectedFileIds,
  toggleFileSelectionForZip,
  onError,
  onSuccess,
}) => {
  const handleUploadSuccess = (newFiles: FileMetadata[]) => {
    //update file list
    setFiles((prev) => [...prev, ...newFiles]);

    //files count
    if (project) {
      setProject({
        ...project,
        filesCount: project.filesCount + newFiles.length,
      });
    }
  };

  const handleDeleteSuccess = (fileId: string) => {
    //update file list
    setFiles((prev) => prev.filter((f) => f.fileId !== fileId));

    //project count
    if (project) {
      setProject({
        ...project,
        filesCount: Math.max(0, project.filesCount - 1),
      });
    }
  };

  return (
    <Card className="shadow-sm flex flex-col h-full">
      <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-slate-900">Files</CardTitle>
        {selectedFileIds.length > 0 && (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
            Selected {selectedFileIds.length} files for ZIP
          </span>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
        <UploadsSection
          projectId={projectId}
          onUploadSuccess={handleUploadSuccess}
          onError={onError}
          onSuccess={onSuccess}
        />

        <FilesList
          projectId={projectId}
          files={files}
          onDeleteSuccess={handleDeleteSuccess}
          selectedFileIds={selectedFileIds}
          toggleFileSelectionForZip={toggleFileSelectionForZip}
          onError={onError}
        />
      </CardContent>
    </Card>
  );
};
