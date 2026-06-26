import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { projectService, ProjectResponse } from '../services/projectService';
import { fileService, FileMetadata } from '../services/fileService';
import { jobService, JobMetadata } from '../services/jobService';

import { ProjectInfoCard } from '../components/ProjectInfoCard';
import { FilesWorkspace } from '../components/FilesWorkspace';
import { JobsWorkspace } from '../components/JobsWorkspace';
import { Header } from '../components/Header';
import { ErrorModal } from '../components/ErrorModal'; // Imported ErrorModal
import { SuccessModal } from '../components/SuccessModal'; // Imported SuccessModal

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  //states
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [jobs, setJobs] = useState<JobMetadata[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const triggerErrorModal = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setIsErrorOpen(true);
  };

  const triggerSuccessModal = (title: string, message: string) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setIsSuccessOpen(true);
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
    }, 1500);

    // cleanup
    return () => clearInterval(intervalId);
  }, [jobs, projectId]);

  const toggleFileSelectionForZip = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      {/*body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 flex flex-col">
        {/*back button */}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Projects
        </button>

        {/*loading*/}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
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

        {/*workspace loaded */}
        {project && !isLoading && (
          <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
            {/* project header */}
            <ProjectInfoCard project={project} />

            {/* tow column layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-h-0">
              {/* files list*/}
              <div className="lg:col-span-2 flex flex-col h-full min-h-0">
                <FilesWorkspace
                  projectId={projectId!}
                  project={project}
                  setProject={setProject}
                  files={files}
                  setFiles={setFiles}
                  selectedFileIds={selectedFileIds}
                  toggleFileSelectionForZip={toggleFileSelectionForZip}
                  onError={triggerErrorModal} // Passed error callback prop
                  onSuccess={triggerSuccessModal} // Passed success callback prop
                />
              </div>

              {/* jobs */}
              <div className="flex flex-col h-full min-h-0">
                <JobsWorkspace
                  projectId={projectId!}
                  project={project}
                  setProject={setProject}
                  jobs={jobs}
                  setJobs={setJobs}
                  selectedFileIds={selectedFileIds}
                  setSelectedFileIds={setSelectedFileIds}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mounted custom popup dialogs */}
      <ErrorModal
        isOpen={isErrorOpen}
        title={errorTitle}
        message={errorMessage}
        onClose={() => {
          setIsErrorOpen(false);
          setErrorMessage('');
        }}
      />

      <SuccessModal
        isOpen={isSuccessOpen}
        title={successTitle}
        message={successMessage}
        onClose={() => {
          setIsSuccessOpen(false);
          setSuccessMessage('');
        }}
      />
    </div>
  );
};
