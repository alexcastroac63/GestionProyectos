import React from 'react';
import { ProjectActivity } from '../../../types';

interface UseProjectActivitiesParams {
  activities: ProjectActivity[];
  setActivities: React.Dispatch<React.SetStateAction<ProjectActivity[]>>;
  addLog: (user: string, action: string) => void;
  setDeleteConfirmState: (state: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null) => void;
}

export function useProjectActivities({
  activities,
  setActivities,
  addLog,
  setDeleteConfirmState
}: UseProjectActivitiesParams) {
  
  const handleAddActivity = (activity: Omit<ProjectActivity, 'id'>) => {
    const newAct: ProjectActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setWorkItemsOrActivities(newAct);
  };

  const setWorkItemsOrActivities = (newAct: ProjectActivity) => {
    setActivities(prev => [...prev, newAct]);
    addLog('Carlos Pérez (PM)', `Añadió la fase Gantt "${newAct.name}"`);
  };

  const handleUpdateActivityProgress = (id: string, progress: number) => {
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        const status = progress === 105 || progress === 100 
          ? 'COMPLETADA' 
          : progress > 0 
            ? 'EN_CURSO' 
            : 'PENDIENTE';
        return { ...a, progress, status };
      }
      return a;
    }));
  };

  const handleDeleteActivity = (id: string) => {
    const act = activities.find(a => a.id === id);
    const actName = act ? `"${act.name}"` : 'esta actividad';
    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Fase de Trabajo',
      message: `¿Está seguro de que desea eliminar permanentemente la fase de planificación ${actName}?`,
      onConfirm: () => {
        setActivities(prev => prev.filter(a => a.id !== id));
      }
    });
  };

  return {
    handleAddActivity,
    handleUpdateActivityProgress,
    handleDeleteActivity
  };
}
