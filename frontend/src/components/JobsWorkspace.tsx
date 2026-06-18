import React, { useState } from 'react';
import { Loader2, DownloadCloud } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { jobService, JobMetadata } from '../services/jobService';
import { ProjectResponse } from '../services/projectService';

interface JobsWorkspaceProps {
  projectId: string;
  project: ProjectResponse | null;
  setProject: React.Dispatch<React.SetStateAction<ProjectResponse | null>>;
  jobs: JobMetadata[];
  setJobs: React.Dispatch<React.SetStateAction<JobMetadata[]>>;
  selectedFileIds: string[];
  setSelectedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const JobsWorkspace: React.FC<JobsWorkspaceProps> = ({
  projectId,
  project,
  setProject,
  jobs,
  setJobs,
  selectedFileIds,
  setSelectedFileIds,
}) => {
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  //createing zip job logic
  const handleCreateZipJob = async () => {
    if (!projectId || selectedFileIds.length === 0) return;

    setIsCreatingJob(true);
    try {
      //compression starts
      const newJob = await jobService.createZipJob(projectId, selectedFileIds);

      //add to job list
      const jobWithDate: JobMetadata = {
        ...newJob,
        createdAt: newJob.createdAt || new Date().toISOString(),
      };
      setJobs((prev) => [jobWithDate, ...prev]);

      //jobs count increase
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
    <Card className="shadow-sm flex flex-col justify-between h-[600px]">
      <div className="flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b border-slate-100 flex flex-col space-y-1">
          <CardTitle className="text-lg font-bold text-slate-900">Compression Jobs</CardTitle>
        </CardHeader>

        {/*jobs list*/}
        <CardContent className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
          {jobs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No zipping jobs.</p>
          ) : (
            <ScrollArea className="flex-1 min-h-0 pr-3">
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="border border-slate-200 rounded-lg p-3 bg-white text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">{job.jobId}</span>

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
                      {job.error && <p className="text-red-600 font-medium">Error: {job.error}</p>}
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
  );
};
