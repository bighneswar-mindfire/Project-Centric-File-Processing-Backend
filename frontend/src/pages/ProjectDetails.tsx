import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';

import { ProjectInfoCard } from '../components/ProjectInfoCard';
import { FilesWorkspace } from '../components/FilesWorkspace';
import { JobsWorkspace } from '../components/JobsWorkspace';
import { Header } from '../components/Header';
import { SuccessModal } from '../components/SuccessModal';
import { ErrorModal } from '../components/ErrorModal';
import { useWorkspace } from '../hooks/useWorkspace';

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { project, setProject, files, setFiles, jobs, setJobs, isLoading, error } =
    useWorkspace(projectId);

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const [modalStatus, setModalStatus] = useState<{
    type: 'success' | 'error' | null;
    title: string;
    message: string;
  }>({ type: null, title: '', message: '' });

  const triggerSuccess = (title: string, message: string) => {
    setModalStatus({ type: 'success', title, message });
  };

  const triggerError = (title: string, message: string) => {
    setModalStatus({ type: 'error', title, message });
  };

  const closeModals = () => {
    setModalStatus((prev) => ({ ...prev, type: null }));
  };

  const toggleFileSelectionForZip = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 flex flex-col">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Projects
        </button>

        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="text-sm text-slate-500">Loading project...</p>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="max-w-xl mx-auto flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <AlertTitle>Error Loading project</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        {project && !isLoading && (
          <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
            <ProjectInfoCard project={project} />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-h-0">
              <div className="lg:col-span-2 flex flex-col h-full min-h-0">
                <FilesWorkspace
                  projectId={projectId!}
                  project={project}
                  setProject={setProject}
                  files={files}
                  setFiles={setFiles}
                  selectedFileIds={selectedFileIds}
                  toggleFileSelectionForZip={toggleFileSelectionForZip}
                  onError={triggerError}
                  onSuccess={triggerSuccess}
                />
              </div>

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

      <SuccessModal
        isOpen={modalStatus.type === 'success'}
        title={modalStatus.title}
        message={modalStatus.message}
        onClose={closeModals}
      />

      <ErrorModal
        isOpen={modalStatus.type === 'error'}
        title={modalStatus.title}
        message={modalStatus.message}
        onClose={closeModals}
      />
    </div>
  );
};
