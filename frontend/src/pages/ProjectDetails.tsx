import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, File, Trash } from 'lucide-react'; // Removed Download
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert } from '../components/ui/Alert';
import { projectService, ProjectResponse } from '../services/projectService';
import { fileService, FileMetadata } from '../services/fileService';

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // states
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // files states
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!projectId) return;
      try {
        const [projectData, filesList] = await Promise.all([
          projectService.getProjectDetails(projectId),
          fileService.getFiles(projectId),
        ]);
        setProject(projectData);
        setFiles(filesList);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve project details.';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [projectId]);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  //drag droop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

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

  //upload
  const handleUpload = async () => {
    if (!projectId || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await fileService.uploadFiles(projectId, selectedFiles, (progress) => {
        setUploadProgress(progress);
      });

      //update file list
      setFiles((prev) => [...prev, ...response.files]);

      setSelectedFiles([]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed.';
      alert(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  //file delete
  const handleDeleteFile = async (fileId: string) => {
    if (!projectId) return;
    try {
      await fileService.deleteFile(projectId, fileId);

      //update file list
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed.';
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Project-Centric File Processing System
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-500">
            Logged in as: <strong className="text-slate-800">{user?.email}</strong>
          </span>

          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 h-9 px-3 text-xs w-auto text-white cursor-pointer"
          >
            Log Out
          </Button>
        </div>
      </header>

      {/*body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/*back */}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Projects
        </button>

        {/*loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="text-sm text-slate-500">Loading project workspace...</p>
          </div>
        )}

        {/* error etate */}
        {error && !isLoading && (
          <Alert className="max-w-xl mx-auto">
            <span className="font-semibold">Error:</span> {error}
          </Alert>
        )}

        {/*body */}
        {project && !isLoading && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* project description */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-mono text-slate-400">PROJECT ID: {project.id}</span>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {project.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>

                <div className="flex items-center justify-end pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Split Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/*files list */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-900">Files</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div
                      className={`grid grid-cols-1 ${selectedFiles.length > 0 ? 'md:grid-cols-2' : ''} gap-6 items-start`}
                    >
                      {/* drag drop zone*/}
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
                            Drag & drop files here, or{' '}
                            <span className="text-slate-600 underline">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
                            Supports multiple file uploads up to 100MB
                          </p>
                        </div>
                      </div>

                      {/*preview */}
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

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex-1 mr-3">
                              {isUploading && (
                                <div className="space-y-1">
                                  {/*progress bar*/}
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-slate-900 h-full transition-all duration-150 rounded-full"
                                      style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                  </div>
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

                    {/*uploaded files list */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-semibold text-slate-900">Uploaded Files</h4>
                      {files.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No files uploaded in this project.
                        </p>
                      ) : (
                        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white max-h-72 overflow-y-auto">
                          {files.map((file) => (
                            <div
                              key={file.fileId}
                              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3 truncate">
                                <File className="h-4.5 w-4.5 text-slate-400 shrink-0" />
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
                                {/*delete*/}
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/*jobs section*/}
              <div className="space-y-6">
                <Card className="shadow-sm min-h-[400px]">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Compression Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 italic"></p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
