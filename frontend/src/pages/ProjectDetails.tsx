import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  File,
  Trash,
  Loader2,
  DownloadCloud,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox'; // Imported Checkbox
import { ScrollArea } from '../components/ui/scroll-area'; // Imported ScrollArea
import { projectService, ProjectResponse } from '../services/projectService';
import { fileService, FileMetadata } from '../services/fileService';
import { jobService, JobMetadata } from '../services/jobService';

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsLoadingUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [jobs, setJobs] = useState<JobMetadata[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  //byte calc
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  //project details and files list
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!projectId) return;
      try {
        const [projectData, filesList, jobsList] = await Promise.all([
          projectService.getProjectDetails(projectId),
          fileService.getFiles(projectId),
          jobService.getJobs(projectId),
        ]);
        setProject(projectData);
        setFiles(filesList);
        setJobs(jobsList);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to retrieve project workspace details.';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [projectId]);

  //polling
  useEffect(() => {
    //activeand uncompleted jobs
    const activeJobs = jobs.filter(
      (job) => job.status === 'PROCESSING' || job.status === 'PENDING',
    );

    //polling stop
    if (activeJobs.length === 0) return;

    //start polling
    const intervalId = setInterval(async () => {
      try {
        const updatedJobs = await Promise.all(
          activeJobs.map(async (job) => {
            const latestStatus = await jobService.getJobStatus(projectId!, job.jobId);
            return latestStatus;
          }),
        );

        //add new jobs back into state
        setJobs((prevJobs) =>
          prevJobs.map((prevJob) => {
            const match = updatedJobs.find((u) => u.jobId === prevJob.jobId);
            return match ? match : prevJob;
          }),
        );

        //list refresh
        const didAnyJobComplete = updatedJobs.some((uj) => {
          const matchingPrevJob = jobs.find((pj) => pj.jobId === uj.jobId);
          return (
            matchingPrevJob && matchingPrevJob.status !== 'COMPLETED' && uj.status === 'COMPLETED'
          );
        });

        if (didAnyJobComplete) {
          const freshFiles = await fileService.getFiles(projectId!);
          setFiles(freshFiles);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error polling background job status:', err);
      }
    }, 1500); // Poll every 1.5 seconds

    // cleanup
    return () => clearInterval(intervalId);
  }, [jobs, projectId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  //file selection checkbox
  const toggleFileSelectionForZip = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  };

  //createing zip job logic
  const handleCreateZipJob = async () => {
    if (!projectId || selectedFileIds.length === 0) return;

    setIsCreatingJob(true);
    try {
      //compression starts
      const newJob = await jobService.createZipJob(projectId, selectedFileIds);

      //add to job list
      setJobs((prev) => [newJob, ...prev]);

      // Increment jobs count dynamically in project header
      if (project) {
        setProject({
          ...project,
          jobsCount: project.jobsCount + 1,
        });
      }

      //checkbox reser
      setSelectedFileIds([]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start compression job.';
      alert(errorMsg);
    } finally {
      setIsCreatingJob(false);
    }
  };

  //download zip
  const handleDownloadZip = (outputFileId: string) => {
    if (!projectId) return;
    window.open(`/api/projects/${projectId}/files/${outputFileId}/download`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/*header*/}
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
        {/*back button */}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Projects
        </button>

        {/*loading*/}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="text-sm text-slate-500">Loading project.</p>
          </div>
        )}

        {/*error state*/}
        {error && !isLoading && (
          <Alert variant="destructive" className="max-w-xl mx-auto flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <AlertTitle>Error Loading project</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        {/*project loaded */}
        {project && !isLoading && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* project header */}
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

                {/*date*/}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      File Count: <strong className="text-slate-700">{project.filesCount}</strong>
                    </span>
                    <span>
                      Job Count: <strong className="text-slate-700">{project.jobsCount}</strong>
                    </span>
                  </div>
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* tow column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* files list*/}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900">Files</CardTitle>
                    {selectedFileIds.length > 0 && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Selected {selectedFileIds.length} files for ZIP
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
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
                            Drag & drop files here, or{' '}
                            <span className="text-slate-600 underline">browse</span>
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
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-semibold text-slate-900">Uploaded Files</h4>
                      {files.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No files uploaded.</p>
                      ) : (
                        // scroll
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
              </div>

              {/* jobs */}
              <div className="space-y-6">
                <Card className="shadow-sm flex flex-col justify-between min-h-[400px]">
                  <div>
                    <CardHeader className="border-b border-slate-100 flex flex-col space-y-1">
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Compression Jobs
                      </CardTitle>
                    </CardHeader>

                    {/*jobs list*/}
                    <CardContent className="p-4 space-y-3">
                      {jobs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-8 text-center">
                          No zipping jobs.
                        </p>
                      ) : (
                        <ScrollArea className="h-[300px] pr-3">
                          <div className="space-y-3">
                            {jobs.map((job) => (
                              <div
                                key={job.jobId}
                                className="border border-slate-200 rounded-lg p-3 bg-white text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {job.jobId}
                                  </span>

                                  {/* job status */}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      job.status === 'COMPLETED'
                                        ? 'bg-green-50 text-green-700'
                                        : job.status === 'FAILED'
                                          ? 'bg-red-50 text-red-700'
                                          : 'bg-blue-50 text-blue-700 animate-pulse'
                                    }`}
                                  >
                                    {job.status}
                                  </span>
                                </div>

                                {/* progress bar */}
                                {(job.status === 'PROCESSING' || job.status === 'PENDING') && (
                                  <div className="space-y-1.5">
                                    <Progress value={job.progress} className="h-1.5" />
                                    <div className="flex justify-between text-[9px] text-slate-400">
                                      <span>Zipping...</span>
                                      <span>{job.progress}%</span>
                                    </div>
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-400 space-y-0.5">
                                  {job.completedAt && (
                                    <p>Finished: {new Date(job.completedAt).toLocaleString()}</p>
                                  )}
                                  {job.error && (
                                    <p className="text-red-600 font-medium">Error: {job.error}</p>
                                  )}
                                </div>

                                {/* download button */}
                                {job.status === 'COMPLETED' && job.outputFileId && (
                                  <Button
                                    onClick={() => handleDownloadZip(job.outputFileId!)}
                                    className="mt-2 w-full h-8 text-[11px] bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-1.5 cursor-pointer"
                                  >
                                    <DownloadCloud className="h-3.5 w-3.5" />
                                    <span>Download ZIP</span>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </div>

                  {/* create zip button */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                    <Button
                      onClick={handleCreateZipJob}
                      disabled={selectedFileIds.length === 0 || isCreatingJob}
                      className="w-full h-10 text-xs bg-slate-900 text-white hover:bg-slate-800 cursor-pointer flex items-center justify-center space-x-2"
                    >
                      {isCreatingJob && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>
                        {isCreatingJob
                          ? 'Starting Compression...'
                          : `Create ZIP Job (${selectedFileIds.length} Selected)`}
                      </span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
