import { useState, useEffect } from 'react';
import { projectService, ProjectResponse } from '../services/projectService';
import { fileService, FileMetadata } from '../services/fileService';
import { jobService, JobMetadata } from '../services/jobService';

export const useWorkspace = (projectId: string | undefined) => {
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [jobs, setJobs] = useState<JobMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!projectId) return;
      try {
        const [projectData, filesRes, jobsRes] = await Promise.all([
          projectService.getProjectDetails(projectId),
          fileService.getFiles(projectId, 1, 50),
          jobService.getJobs(projectId, 1, 50),
        ]);
        setProject(projectData);
        setFiles(filesRes.data);
        setJobs(jobsRes.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load workspace.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspaceData();
  }, [projectId]);

  useEffect(() => {
    const activeJobs = jobs.filter(
      (job) => job.status === 'PROCESSING' || job.status === 'PENDING',
    );
    if (!projectId || activeJobs.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        const updatedJobs = await Promise.all(
          activeJobs.map((job) => jobService.getJobStatus(projectId, job.jobId)),
        );

        setJobs((prevJobs) =>
          prevJobs.map((prevJob) => {
            const match = updatedJobs.find((u) => u.jobId === prevJob.jobId);
            return match ? match : prevJob;
          }),
        );

        //check if job is completed
        const didAnyJobComplete = updatedJobs.some((uj) => {
          const matchingPrevJob = jobs.find((pj) => pj.jobId === uj.jobId);
          return matchingPrevJob?.status !== 'COMPLETED' && uj.status === 'COMPLETED';
        });

        if (didAnyJobComplete) {
          const freshFiles = await fileService.getFiles(projectId, 1, 50);
          setFiles(freshFiles.data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [jobs, projectId]);

  return {
    project,
    setProject,
    files,
    setFiles,
    jobs,
    setJobs,
    isLoading,
    error,
  };
};
