import React, { useState } from 'react';
import { X } from 'lucide-react';
import { projectService, ProjectResponse } from '../services/projectService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert } from './ui/Alert';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: ProjectResponse) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  //on close
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    //validation
    if (!name.trim() || !description.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const newProject = await projectService.createProject(name.trim(), description.trim());

      //reset states
      onProjectCreated(newProject);
      setName('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create project.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    //close modal on outside click
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-semibold text-slate-900">Create New Project</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <Alert className="mb-4">{error}</Alert>}

          <div className="space-y-1">
            <Label htmlFor="proj-name">Project Name</Label>
            <Input
              id="proj-name"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="proj-desc">Description</Label>
            <Input
              id="proj-desc"
              placeholder="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-10 w-auto cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 w-auto bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
