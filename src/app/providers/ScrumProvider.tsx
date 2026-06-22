import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sprint, WorkItem, ProjectActivity } from '../../types';
import { scrumRepository } from '../../features/scrum/infrastructure/scrumRepository';

export interface ScrumContextType {
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  activities: ProjectActivity[];
  setActivities: React.Dispatch<React.SetStateAction<ProjectActivity[]>>;
  selectedSprintId: string;
  setSelectedSprintId: (id: string) => void;
}

export const ScrumContext = createContext<ScrumContextType | undefined>(undefined);

export const ScrumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sprints, setSprints] = useState<Sprint[]>(() => scrumRepository.loadSprints());
  const [workItems, setWorkItems] = useState<WorkItem[]>(() => scrumRepository.loadWorkItems());
  const [activities, setActivities] = useState<ProjectActivity[]>(() => scrumRepository.loadActivities());
  const [selectedSprintId, setSelectedSprintId] = useState<string>('sprint-2');

  // Sync state with repository on changes
  useEffect(() => {
    scrumRepository.saveSprints(sprints);
  }, [sprints]);

  useEffect(() => {
    scrumRepository.saveWorkItems(workItems);
  }, [workItems]);

  useEffect(() => {
    scrumRepository.saveActivities(activities);
  }, [activities]);

  return (
    <ScrumContext.Provider value={{
      sprints, setSprints, workItems, setWorkItems, activities, setActivities,
      selectedSprintId, setSelectedSprintId
    }}>
      {children}
    </ScrumContext.Provider>
  );
};

export const useScrumStore = () => {
  const context = useContext(ScrumContext);
  if (!context) throw new Error('useScrumStore debe utilizarse dentro de ScrumProvider o AppProviders');
  return context;
};
