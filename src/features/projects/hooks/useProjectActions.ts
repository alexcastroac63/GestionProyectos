import React from 'react';
import { Project, ProjectStatus } from '../../../types';

interface UseProjectActionsProps {
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addLog: (user: string, action: string) => void;
}

export function useProjectActions({ setProjects, addLog }: UseProjectActionsProps) {
  const updateProjectStatus = (projId: string, status: ProjectStatus) => {
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, status } : p));
    addLog('Carlos Pérez (PM)', `Actualizó estado del proyecto a: ${status}`);
  };

  return {
    updateProjectStatus
  };
}
