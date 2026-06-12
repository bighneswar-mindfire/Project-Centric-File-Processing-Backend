import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { ProjectResponse } from '../services/projectService';

export const ProjectsPlaceholder: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    //clearing token
    logout();

    //back to login page
    navigate('/login');
  };

  const handleProjectCreated = (newProject: ProjectResponse) => {
    console.log('Project created successfully:', newProject);
    alert('project created successfully with ID: ${newProject.id}');
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
            className="bg-red-600 hover:bg-red-700 h-9 px-3 text-xs w-auto text-white"
          >
            Log Out
          </Button>
        </div>
      </header>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-slate-900 hover:bg-slate-800 h-9 px-3 text-xs w-auto text-white cursor-pointer"
      >
        Create Project
      </Button>
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
