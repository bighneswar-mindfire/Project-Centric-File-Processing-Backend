import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, Trash } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { fileService, FileMetadata } from '../services/fileService';
import { ProjectResponse } from '../services/projectService';

interface FilesWorkspaceProps {
  projectId: string;
  project: ProjectResponse | null;
  setProject: React.Dispatch<React.SetStateAction<ProjectResponse | null>>;
  files: FileMetadata[];
  setFiles: React.Dispatch<React.SetStateAction<FileMetadata[]>>;
  selectedFileIds: string[];
  toggleFileSelectionForZip: (fileId: string) => void;
}

export const FilesWorkspace: React.FC<FilesWorkspaceProps> = ({
  projectId,
  project,
  setProject,
  files,
  setFiles,
  selectedFileIds,
  toggleFileSelectionForZip,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsLoadingUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  //byte calc
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  //drag drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  //drag drop
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  //file upload
  const handleUpload = async () => {
    if (!projectId || selectedFiles.length === 0) return;

    setIsLoadingUploading(true);
    setUploadProgress(0);

    try {
      const response = await fileService.uploadFiles(projectId, selectedFiles, (progress) => {
        setUploadProgress(progress);
      });

      //update file list
      setFiles((prev) => [...prev, ...response.files]);

      // Update files count dynamically in project header
      if (project) {
        setProject({
          ...project,
          filesCount: project.filesCount + response.files.length,
        });
      }

      //reset selection
      setSelectedFiles([]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed.';
      alert(errorMsg);
    } finally {
      setIsLoadingUploading(false);
    }
  };

  //file deletion logic
  const handleDeleteFile = async (fileId: string) => {
    if (!projectId) return;
    try {
      await fileService.deleteFile(projectId, fileId);

      //update file list
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));

      // Decrement files count dynamically in project header
      if (project) {
        setProject({
          ...project,
          filesCount: Math.max(0, project.filesCount - 1),
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed.';
      alert(errorMsg);
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
        {/* drag drop */}
        <div
          className={`grid grid-cols-1 ${selectedFiles.length > 0 ? 'md:grid-cols-2' : ''} gap-6 items-start`}
        >
          {/*drag drop area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2 h-44 ${
              isDragging
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <UploadCloud className="h-8 w-8 text-slate-400" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-900">
                Drag & drop files here, or <span className="text-slate-600 underline">browse</span>
              </p>
              <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
                Supports multiple file uploads
              </p>
            </div>
          </div>

          {/* selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white h-44 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="text-xs font-semibold text-slate-900 mb-1">
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="divide-y divide-slate-100 overflow-y-auto flex-1 pr-1">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 text-[11px]"
                    >
                      <span
                        className="font-medium text-slate-700 truncate max-w-[140px]"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <span>{formatBytes(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          className="text-red-500 hover:text-red-700 cursor-pointer font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* progress bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex-1 mr-3">
                  {isUploading && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress} className="h-2" />
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-auto h-8 text-[11px] px-3 shrink-0"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* file list*/}
        <div className="space-y-3 pt-2 flex-1 flex flex-col min-h-0">
          <h4 className="text-sm font-semibold text-slate-900">Uploaded Files</h4>
          {files.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No files uploaded.</p>
          ) : (
            <ScrollArea className="flex-1 min-h-0 border border-slate-200 rounded-lg bg-white">
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
                      {/*delete button*/}
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
      </CardContent>
    </Card>
  );
};
