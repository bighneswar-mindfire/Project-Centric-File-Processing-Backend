import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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
  );
};
